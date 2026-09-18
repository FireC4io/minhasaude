import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Diary (e2e)', () => {
  let app: INestApplication;
  const email = `diary-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  let accessToken: string;
  let foodId: string;

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

    const food = await request(app.getHttpServer())
      .post('/v1/foods')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Peito de frango grelhado', kcalPer100g: 165, proteinGPer100g: 31, fatGPer100g: 3.6, carbGPer100g: 0 });
    foodId = food.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra uma entrada, edita o alimento depois, e a entrada antiga mantém o snapshot', async () => {
    const entry = await request(app.getHttpServer())
      .post('/v1/diary')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ foodId, date: '2026-09-18', mealType: 'lunch', quantity: 200, unit: 'grams' })
      .expect(201);
    expect(Number(entry.body.kcalSnapshot)).toBe(330); // 165 * 2

    await request(app.getHttpServer())
      .patch(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ kcalPer100g: 300 })
      .expect(200);

    const day = await request(app.getHttpServer())
      .get('/v1/diary')
      .query({ date: '2026-09-18' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(day.body.meals.lunch).toHaveLength(1);
    expect(Number(day.body.meals.lunch[0].kcalSnapshot)).toBe(330); // não virou 999*2
    expect(day.body.summary.consumed.kcal).toBe(330);
    expect(day.body.summary.target).toBeNull(); // sem meta calculada ainda
  });

  it('POST /v1/diary/copy duplica o dia inteiro, resnapshotando a partir do alimento atual', async () => {
    await request(app.getHttpServer())
      .post('/v1/diary/copy')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fromDate: '2026-09-18', toDate: '2026-09-19' })
      .expect(201);

    const day = await request(app.getHttpServer())
      .get('/v1/diary')
      .query({ date: '2026-09-19' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(day.body.meals.lunch).toHaveLength(1);
    // alimento foi editado pra 300kcal/100g antes da cópia -> 300*2 = 600
    expect(Number(day.body.meals.lunch[0].kcalSnapshot)).toBe(600);
  });

  it('PATCH/DELETE de entrada de outro usuário retorna 404', async () => {
    const otherEmail = `diary-other-${Date.now()}@minhasaude.app`;
    await request(app.getHttpServer()).post('/v1/auth/register').send({ email: otherEmail, password });
    const otherLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: otherEmail, password });

    const day = await request(app.getHttpServer())
      .get('/v1/diary')
      .query({ date: '2026-09-18' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const entryId = day.body.meals.lunch[0].id;

    await request(app.getHttpServer())
      .patch(`/v1/diary/${entryId}`)
      .set('Authorization', `Bearer ${otherLogin.body.accessToken}`)
      .send({ quantity: 50 })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/v1/diary/${entryId}`)
      .set('Authorization', `Bearer ${otherLogin.body.accessToken}`)
      .expect(404);
  });

  it('remove uma entrada de verdade', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/diary')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ foodId, date: '2026-09-20', mealType: 'snack', quantity: 50, unit: 'grams' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/v1/diary/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const day = await request(app.getHttpServer())
      .get('/v1/diary')
      .query({ date: '2026-09-20' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(day.body.meals.snack).toHaveLength(0);
  });

  it('GET /v1/me/export inclui o histórico do diário', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(response.body.diaryEntries.length).toBeGreaterThan(0);
  });
});
