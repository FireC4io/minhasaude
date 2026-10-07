import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Micronutrientes (e2e)', () => {
  let app: INestApplication;
  let auth: { Authorization: string };
  const hoje = new Date().toISOString().slice(0, 10);

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
    const email = `micros-${Date.now()}@minhasaude.app`;
    const password = 'SenhaForte123';
    await request(server).post('/v1/auth/register').send({ email, password });
    const login = await request(server).post('/v1/auth/login').send({ email, password });
    auth = { Authorization: `Bearer ${login.body.accessToken}` };
    await request(server)
      .post('/v1/consents')
      .set(auth)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' });
  });

  afterAll(async () => {
    await app.close();
  });

  async function findTaco(name: string): Promise<{ id: string; micros: Record<string, number | null> }> {
    const res = await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q: name, limit: 50 })
      .set(auth)
      .expect(200);
    return res.body.data.find((f: { name: string }) => f.name === name);
  }

  it('a busca traz os micronutrientes da TACO por 100 g', async () => {
    const feijao = await findTaco('Feijão, carioca, cozido');
    expect(feijao.micros).toMatchObject({ fiberG: 8.51, ironMg: 1.29, potassiumMg: 254.62 });
    expect(feijao.micros.vitaminARaeMcg).toBeNull();
  });

  it('a entrada do diário congela os micronutrientes da quantidade', async () => {
    const feijao = await findTaco('Feijão, carioca, cozido');
    const res = await request(app.getHttpServer())
      .post('/v1/diary')
      .set(auth)
      .send({ foodId: feijao.id, date: hoje, mealType: 'lunch', quantity: 200, unit: 'grams' })
      .expect(201);

    expect(res.body.microsSnapshot).toMatchObject({ ironMg: 2.58, fiberG: 17.02 });
  });

  it('o resumo do dia soma e diz quantos itens tinham cada dado', async () => {
    const banana = await findTaco('Banana, prata, crua');
    await request(app.getHttpServer())
      .post('/v1/diary')
      .set(auth)
      .send({ foodId: banana.id, date: hoje, mealType: 'snack', quantity: 100, unit: 'grams' })
      .expect(201);

    const day = await request(app.getHttpServer()).get('/v1/diary').query({ date: hoje }).set(auth).expect(200);
    const { micros } = day.body.summary;

    expect(micros.ironMg.items).toBe(2);
    expect(micros.ironMg.itemsWithData).toBe(2);
    expect(micros.ironMg.amount).toBeCloseTo(2.58 + (banana.micros.ironMg ?? 0), 2);
    // Feijão não tem vitamina A medida: o total é parcial, não zero completo.
    expect(micros.vitaminARaeMcg.itemsWithData).toBeLessThan(2);
  });
});
