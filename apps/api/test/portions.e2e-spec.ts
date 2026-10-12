import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Medidas caseiras (e2e)', () => {
  let app: INestApplication;
  let auth: { Authorization: string };
  let otherAuth: { Authorization: string };
  const hoje = new Date().toISOString().slice(0, 10);

  async function login(prefix: string): Promise<{ Authorization: string }> {
    const server = app.getHttpServer();
    const email = `${prefix}-${Date.now()}@minhasaude.app`;
    const password = 'SenhaForte123';
    await request(server).post('/v1/auth/register').send({ email, password });
    const res = await request(server).post('/v1/auth/login').send({ email, password });
    const header = { Authorization: `Bearer ${res.body.accessToken}` };
    await request(server)
      .post('/v1/consents')
      .set(header)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' });
    return header;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    auth = await login('medidas');
    otherAuth = await login('medidas-outra');
  });

  afterAll(async () => {
    await app.close();
  });

  async function findTaco(name: string): Promise<{ id: string }> {
    const res = await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q: name, limit: 50 })
      .set(auth)
      .expect(200);
    return res.body.data.find((f: { name: string }) => f.name === name);
  }

  it('alimento da TACO traz as medidas do IBGE, sem dono exposto', async () => {
    const arroz = await findTaco('Arroz, tipo 1, cozido');
    const res = await request(app.getHttpServer()).get(`/v1/foods/${arroz.id}/portions`).set(auth).expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        { id: expect.any(String), kind: 'tablespoon', label: null, grams: '25.00', custom: false },
        { id: expect.any(String), kind: 'serving_spoon', label: null, grams: '45.00', custom: false },
      ]),
    );
    expect(Object.keys(res.body[0]).sort()).toEqual(['custom', 'grams', 'id', 'kind', 'label']);
  });

  it('anotar 2 colheres de sopa de arroz conta 50 g e devolve a medida', async () => {
    const arroz = await findTaco('Arroz, tipo 1, cozido');
    const portions = await request(app.getHttpServer()).get(`/v1/foods/${arroz.id}/portions`).set(auth);
    const colher = portions.body.find((p: { kind: string }) => p.kind === 'tablespoon');

    const porGramas = await request(app.getHttpServer())
      .post('/v1/diary')
      .set(auth)
      .send({ foodId: arroz.id, date: hoje, mealType: 'lunch', quantity: 50, unit: 'grams' })
      .expect(201);
    const porMedida = await request(app.getHttpServer())
      .post('/v1/diary')
      .set(auth)
      .send({ foodId: arroz.id, date: hoje, mealType: 'lunch', quantity: 2, unit: 'portion', portionId: colher.id })
      .expect(201);

    expect(porMedida.body.kcalSnapshot).toBe(porGramas.body.kcalSnapshot);
    expect(porMedida.body.portion).toMatchObject({ kind: 'tablespoon', grams: '25.00' });
  });

  it('medida própria: só a dona vê e usa; apagar passa as anotações para gramas', async () => {
    const server = app.getHttpServer();
    const feijao = await findTaco('Feijão, carioca, cozido');
    const created = await request(server)
      .post(`/v1/foods/${feijao.id}/portions`)
      .set(auth)
      .send({ label: 'Minha concha', grams: 120 })
      .expect(201);
    expect(created.body).toMatchObject({ kind: null, label: 'Minha concha', grams: '120.00', custom: true });

    const daOutra = await request(server).get(`/v1/foods/${feijao.id}/portions`).set(otherAuth).expect(200);
    expect(daOutra.body.some((p: { id: string }) => p.id === created.body.id)).toBe(false);
    await request(server)
      .post('/v1/diary')
      .set(otherAuth)
      .send({ foodId: feijao.id, date: hoje, mealType: 'lunch', quantity: 1, unit: 'portion', portionId: created.body.id })
      .expect(400);
    await request(server).delete(`/v1/portions/${created.body.id}`).set(otherAuth).expect(404);

    const entry = await request(server)
      .post('/v1/diary')
      .set(auth)
      .send({ foodId: feijao.id, date: hoje, mealType: 'dinner', quantity: 1.5, unit: 'portion', portionId: created.body.id })
      .expect(201);

    await request(server).delete(`/v1/portions/${created.body.id}`).set(auth).expect(204);

    const day = await request(server).get('/v1/diary').query({ date: hoje }).set(auth).expect(200);
    const after = day.body.meals.dinner.find((e: { id: string }) => e.id === entry.body.id);
    expect(after).toMatchObject({ unit: 'grams', quantity: '180.00', portionId: null, portion: null });
    expect(after.kcalSnapshot).toBe(entry.body.kcalSnapshot);
  });

  it('recusa medida sem nome, com < >, ou com peso fora do limite', async () => {
    const server = app.getHttpServer();
    const feijao = await findTaco('Feijão, carioca, cozido');
    const post = (body: object) => request(server).post(`/v1/foods/${feijao.id}/portions`).set(auth).send(body);
    await post({ label: '   ', grams: 10 }).expect(400);
    await post({ label: '<b>x</b>', grams: 10 }).expect(400);
    await post({ label: 'Pote', grams: 0 }).expect(400);
    await post({ label: 'Pote', grams: 5000 }).expect(400);
    await post({ label: 'Pote', grams: 10, userId: 'x' }).expect(400);
  });
});
