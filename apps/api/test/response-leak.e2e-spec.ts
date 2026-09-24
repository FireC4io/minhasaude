import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Trava o vazamento de campo interno nas respostas da API.
 *
 * Os controllers devolviam a entidade crua do TypeORM: o DTO documentava o
 * contrato no Swagger mas não filtrava nada, então `userId`, `ownerUserId`,
 * timestamps e afins viajavam pro cliente. Este teste falha se alguém voltar a
 * retornar entidade sem passar pelo `toDto`.
 */

// Campos que nunca devem aparecer em resposta da API, em nenhum nível.
// `passwordHash` é o crítico: hoje só era removido por um destructuring manual.
const CAMPOS_INTERNOS = [
  'passwordHash',
  'password_hash',
  'tokenHash',
  'userId',
  'ownerUserId',
  'createdAt',
  'updatedAt',
  'externalId',
  'barcode',
  'rawPayload',
  'deletedAt',
];

function coletarChaves(valor: unknown, caminho = '', encontradas: string[] = []): string[] {
  if (Array.isArray(valor)) {
    valor.forEach((item, i) => coletarChaves(item, `${caminho}[${i}]`, encontradas));
    return encontradas;
  }
  if (valor !== null && typeof valor === 'object') {
    for (const [chave, sub] of Object.entries(valor as Record<string, unknown>)) {
      const completo = caminho ? `${caminho}.${chave}` : chave;
      if (CAMPOS_INTERNOS.includes(chave)) {
        encontradas.push(completo);
      }
      coletarChaves(sub, completo, encontradas);
    }
  }
  return encontradas;
}

describe('Vazamento de campos internos nas respostas (e2e)', () => {
  let app: INestApplication;
  const email = `leak-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  const hoje = new Date().toISOString().slice(0, 10);
  let accessToken: string;
  let foodId: string;

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
    accessToken = login.body.accessToken;

    const auth = { Authorization: `Bearer ${accessToken}` };
    await request(server)
      .post('/v1/consents')
      .set(auth)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' });
    await request(server)
      .patch('/v1/me/profile')
      .set(auth)
      .send({
        birthDate: '1995-04-10',
        sex: 'male',
        heightCm: 178,
        activityLevel: 'moderate',
        goal: 'maintain',
      });
    await request(server)
      .post('/v1/body-measurements')
      .set(auth)
      .send({ measuredAt: new Date().toISOString(), source: 'manual', weightKg: 78.4 });
    await request(server).post('/v1/goals/recalculate').set(auth).send({});

    const food = await request(server)
      .post('/v1/foods')
      .set(auth)
      .send({
        name: 'Alimento de teste',
        kcalPer100g: 100,
        proteinGPer100g: 10,
        fatGPer100g: 5,
        carbGPer100g: 8,
      });
    foodId = food.body.id;

    await request(server)
      .post('/v1/diary')
      .set(auth)
      .send({ foodId, date: hoje, mealType: 'lunch', quantity: 150, unit: 'grams' });
  });

  afterAll(async () => {
    await app.close();
  });

  function get(url: string) {
    return request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${accessToken}`);
  }

  it.each([
    ['/v1/me'],
    ['/v1/goals/current'],
    ['/v1/goals/history'],
    ['/v1/consents'],
    ['/v1/body-measurements?source=manual'],
    ['/v1/foods/search?q=teste'],
  ])('%s não expõe campo interno', async (url) => {
    const res = await get(url).expect(200);

    expect(coletarChaves(res.body)).toEqual([]);
  });

  it('GET /v1/diary não expõe campo interno, nem dentro do alimento aninhado', async () => {
    const res = await get(`/v1/diary?date=${hoje}`).expect(200);

    expect(coletarChaves(res.body)).toEqual([]);
  });

  it('GET /v1/foods/:id não expõe campo interno', async () => {
    const res = await get(`/v1/foods/${foodId}`).expect(200);

    expect(coletarChaves(res.body)).toEqual([]);
  });

  it('nunca devolve passwordHash em /v1/me', async () => {
    const res = await get('/v1/me').expect(200);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('$argon2');
  });

  it('continua entregando os campos que o contrato promete', async () => {
    // O filtro não pode ter cortado demais.
    const me = await get('/v1/me').expect(200);
    expect(me.body.user.email).toBe(email);
    expect(me.body.profile.heightCm).toBeDefined();

    const diary = await get(`/v1/diary?date=${hoje}`).expect(200);
    expect(diary.body.meals.lunch[0].food.name).toBe('Alimento de teste');
    expect(diary.body.summary.consumed.kcal).toBeGreaterThan(0);
    expect(diary.body.summary.target).not.toBeNull();

    const goal = await get('/v1/goals/current').expect(200);
    expect(goal.body.targetKcal).toBeDefined();
    expect(goal.body.id).toBeDefined();
  });

  it('export LGPD continua completo, mas sem o hash de senha', async () => {
    // Exceção consciente: o export é o direito de portabilidade, então NÃO
    // passa pelo filtro dos DTOs - o usuário tem direito aos dados completos.
    const res = await get('/v1/me/export').expect(200);

    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining(['account', 'profile', 'consents', 'bodyMeasurements', 'goals', 'diaryEntries']),
    );
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});
