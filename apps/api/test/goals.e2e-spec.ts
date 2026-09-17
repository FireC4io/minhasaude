import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Goals (e2e)', () => {
  let app: INestApplication;
  const email = `goals-${Date.now()}@minhasaude.app`;
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

    await request(app.getHttpServer())
      .post('/v1/consents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/goals/current retorna 404 antes de qualquer cálculo', async () => {
    await request(app.getHttpServer())
      .get('/v1/goals/current')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('POST /v1/goals/recalculate rejeita perfil incompleto (400)', async () => {
    await request(app.getHttpServer())
      .post('/v1/goals/recalculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);
  });

  it('POST /v1/goals/recalculate rejeita sem medida corporal, mesmo com perfil completo (400)', async () => {
    await request(app.getHttpServer())
      .patch('/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ birthDate: '1990-06-15', sex: 'male', heightCm: 178, activityLevel: 'moderate', goal: 'lose' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/goals/recalculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);
  });

  it('calcula, lê, ajusta manualmente e mantém histórico', async () => {
    await request(app.getHttpServer())
      .post('/v1/body-measurements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ measuredAt: new Date().toISOString(), source: 'manual', weightKg: 80 })
      .expect(201);

    const recalculated = await request(app.getHttpServer())
      .post('/v1/goals/recalculate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);
    expect(recalculated.body.calculationMethod).toBe('mifflin_st_jeor');
    expect(recalculated.body.isManualOverride).toBe(false);
    const tdee = Number(recalculated.body.tdeeKcal);
    const target = Number(recalculated.body.targetKcal);
    expect(target).toBeCloseTo(tdee - 500, 1);

    const current = await request(app.getHttpServer())
      .get('/v1/goals/current')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(current.body.id).toBe(recalculated.body.id);

    const adjusted = await request(app.getHttpServer())
      .patch('/v1/goals/current')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetKcal: 1800 })
      .expect(200);
    expect(adjusted.body.isManualOverride).toBe(true);
    expect(Number(adjusted.body.targetKcal)).toBe(1800);
    // Ajuste manual preserva o bmr/tdee calculados, só muda o alvo/macros.
    expect(Number(adjusted.body.bmrKcal)).toBeCloseTo(Number(recalculated.body.bmrKcal), 2);

    const history = await request(app.getHttpServer())
      .get('/v1/goals/history')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(history.body.meta.total).toBe(2);
    // Mais recente (o ajuste manual) primeiro.
    expect(history.body.data[0].id).toBe(adjusted.body.id);

    const nowCurrent = await request(app.getHttpServer())
      .get('/v1/goals/current')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(nowCurrent.body.id).toBe(adjusted.body.id);
  });

  it('PATCH /v1/goals/current sem nenhum campo retorna 400', async () => {
    await request(app.getHttpServer())
      .patch('/v1/goals/current')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);
  });

  it('GET /v1/me/export inclui o histórico de metas', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(response.body.goals.length).toBe(2);
  });
});
