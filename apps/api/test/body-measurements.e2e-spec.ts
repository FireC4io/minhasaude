import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Body measurements (e2e)', () => {
  let app: INestApplication;
  const email = `body-measurements-${Date.now()}@minhasaude.app`;
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

  it('bloqueia POST sem consentimento com a política de privacidade (403)', async () => {
    await request(app.getHttpServer())
      .post('/v1/body-measurements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ measuredAt: '2026-09-01T12:00:00.000Z', source: 'manual', weightKg: 80 })
      .expect(403);
  });

  it('rejeita source diferente de manual (400)', async () => {
    await request(app.getHttpServer())
      .post('/v1/consents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/body-measurements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ measuredAt: '2026-09-01T12:00:00.000Z', source: 'inbody', weightKg: 80 })
      .expect(400);
  });

  it('registra medidas manuais e lista filtrando por período', async () => {
    await request(app.getHttpServer())
      .post('/v1/body-measurements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ measuredAt: '2026-08-01T12:00:00.000Z', source: 'manual', weightKg: 82 })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/v1/body-measurements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ measuredAt: '2026-09-01T12:00:00.000Z', source: 'manual', weightKg: 80, bodyFatPercent: 17.2 })
      .expect(201);
    expect(Number(second.body.weightKg)).toBe(80);
    expect(Number(second.body.bodyFatPercent)).toBe(17.2);

    const all = await request(app.getHttpServer())
      .get('/v1/body-measurements')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(all.body.meta.total).toBe(2);
    expect(all.body.data[0].weightKg).toBeDefined();
    // Ordenado por measured_at DESC - o registro de setembro vem primeiro.
    expect(new Date(all.body.data[0].measuredAt).getMonth()).toBe(8);

    const filtered = await request(app.getHttpServer())
      .get('/v1/body-measurements')
      .query({ from: '2026-08-15T00:00:00.000Z' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(filtered.body.meta.total).toBe(1);
    expect(new Date(filtered.body.data[0].measuredAt).getMonth()).toBe(8);
  });

  it('GET /v1/me/export inclui o histórico de medidas corporais', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(response.body.bodyMeasurements.length).toBe(2);
  });

  it('não vaza medidas de um usuário para outro', async () => {
    const otherEmail = `body-measurements-other-${Date.now()}@minhasaude.app`;
    await request(app.getHttpServer()).post('/v1/auth/register').send({ email: otherEmail, password });
    const otherLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: otherEmail, password });

    const list = await request(app.getHttpServer())
      .get('/v1/body-measurements')
      .set('Authorization', `Bearer ${otherLogin.body.accessToken}`)
      .expect(200);
    expect(list.body.meta.total).toBe(0);
  });
});
