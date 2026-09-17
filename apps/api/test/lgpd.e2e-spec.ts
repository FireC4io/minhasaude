import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('LGPD - consents, export, delete (e2e)', () => {
  let app: INestApplication;
  const email = `lgpd-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    await request(app.getHttpServer()).post('/v1/auth/register').send({ email, password });
    const login = await request(app.getHttpServer()).post('/v1/auth/login').send({ email, password });
    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('bloqueia ação sensível sem consentimento (403)', async () => {
    await request(app.getHttpServer())
      .patch('/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ heightCm: 175 })
      .expect(403);
  });

  it('concede consentimento e libera a ação', async () => {
    await request(app.getHttpServer())
      .post('/v1/consents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' })
      .expect(201);

    const status = await request(app.getHttpServer())
      .get('/v1/consents')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const privacy = status.body.find((c: { consentType: string }) => c.consentType === 'privacy_policy');
    expect(privacy.granted).toBe(true);

    const profileResponse = await request(app.getHttpServer())
      .patch('/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ heightCm: 175, sex: 'male' })
      .expect(200);
    expect(Number(profileResponse.body.heightCm)).toBe(175);
  });

  it('GET /v1/me/export retorna conta, perfil e consentimentos de verdade', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.account.email).toBe(email);
    expect(response.body.account.passwordHash).toBeUndefined();
    expect(response.body.profile.sex).toBe('male');
    expect(response.body.consents.length).toBeGreaterThan(0);
  });

  it('DELETE /v1/me inicia exclusão e bloqueia login em seguida', async () => {
    const response = await request(app.getHttpServer())
      .delete('/v1/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(202);
    expect(response.body.scheduledPurgeAt).toBeDefined();

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(401);
  });

  it('revogar um consentimento inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .delete('/v1/consents/exam_data_processing')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
