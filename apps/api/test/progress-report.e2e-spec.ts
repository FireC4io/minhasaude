import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Dados do relatório de progresso em PDF (gerado no celular). Endpoint
 * separado do export LGPD para não mudar o conteúdo da exportação, que o dono
 * do projeto ainda vai discutir.
 */
describe('GET /v1/me/progress-report (e2e)', () => {
  let app: INestApplication;
  const email = `report-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  const hoje = new Date().toISOString().slice(0, 10);
  let auth: { Authorization: string };
  const foodName = `Alimento relatório ${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const server = app.getHttpServer();
    await request(server).post('/v1/auth/register').send({ email, password });
    const login = await request(server).post('/v1/auth/login').send({ email, password });
    auth = { Authorization: `Bearer ${login.body.accessToken}` };

    await request(server)
      .post('/v1/consents')
      .set(auth)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' });
    await request(server).patch('/v1/me/profile').set(auth).send({
      birthDate: '1990-01-01',
      sex: 'female',
      heightCm: 165,
      activityLevel: 'light',
      goal: 'lose',
    });
    await request(server)
      .post('/v1/body-measurements')
      .set(auth)
      .send({ measuredAt: '2026-09-01T10:00:00.000Z', source: 'manual', weightKg: 63 });
    await request(server)
      .post('/v1/body-measurements')
      .set(auth)
      .send({ measuredAt: '2026-10-01T10:00:00.000Z', source: 'manual', weightKg: 62 });
    await request(server)
      .post('/v1/body-measurements')
      .set(auth)
      .send({ measuredAt: '2026-10-02T10:00:00.000Z', source: 'inbody', weightKg: 61.5 });
    await request(server).post('/v1/goals/recalculate').set(auth).send({});

    const food = await request(server).post('/v1/foods').set(auth).send({
      name: foodName,
      kcalPer100g: 50,
      proteinGPer100g: 1,
      fatGPer100g: 1,
      carbGPer100g: 5,
    });
    await request(server)
      .post('/v1/diary')
      .set(auth)
      .send({ foodId: food.body.id, date: hoje, mealType: 'lunch', quantity: 200, unit: 'grams' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('exige autenticação', async () => {
    await request(app.getHttpServer()).get('/v1/me/progress-report').expect(401);
  });

  it('traz pesos manuais, metas e diário com o nome do alimento', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/me/progress-report')
      .set(auth)
      .expect(200);

    const body = response.body;
    expect(body.generatedAt).toBeDefined();
    // Só a balança comum: o relatório nunca mistura aparelhos diferentes.
    expect(body.weights.map((w: { weightKg: string }) => Number(w.weightKg))).toEqual([63, 62]);
    expect(body.goals).toHaveLength(1);
    expect(Number(body.goals[0].targetKcal)).toBeGreaterThan(0);
    expect(body.diaryEntries).toHaveLength(1);
    expect(body.diaryEntries[0].food.name).toBe(foodName);
    expect(Number(body.diaryEntries[0].kcalSnapshot)).toBe(100);
  });

  it('não vaza campo interno', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/me/progress-report')
      .set(auth)
      .expect(200);

    const texto = JSON.stringify(response.body);
    for (const campo of ['userId', 'ownerUserId', 'passwordHash', 'rawPayload', 'profileSnapshot']) {
      expect(texto).not.toContain(`"${campo}"`);
    }
  });
});
