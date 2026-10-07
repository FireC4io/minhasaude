import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Ordem da busca com casos reais da TACO. Antes, tudo que continha o termo
 * empatava e o desempate era alfabético: "arroz" trazia "Arroz carreteiro"
 * primeiro e "feijão" trazia "Baião de dois".
 */
describe('Foods search - relevância (e2e)', () => {
  let app: INestApplication;
  const password = 'SenhaForte123';
  let auth: { Authorization: string };
  let otherAuth: { Authorization: string };

  async function login(email: string): Promise<{ Authorization: string }> {
    const server = app.getHttpServer();
    await request(server).post('/v1/auth/register').send({ email, password });
    const res = await request(server).post('/v1/auth/login').send({ email, password });
    return { Authorization: `Bearer ${res.body.accessToken}` };
  }

  async function names(q: string, who = auth): Promise<string[]> {
    const res = await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q, limit: 50 })
      .set(who)
      .expect(200);
    return res.body.data.map((f: { name: string }) => f.name);
  }

  const before = (list: string[], a: string, b: string): boolean =>
    list.indexOf(a) !== -1 && (list.indexOf(b) === -1 || list.indexOf(a) < list.indexOf(b));

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

    auth = await login(`relevancia-${Date.now()}@minhasaude.app`);
    otherAuth = await login(`relevancia-outro-${Date.now()}@minhasaude.app`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('"arroz": arroz cozido primeiro, prato composto depois', async () => {
    const list = await names('arroz');
    expect(list[0]).toBe('Arroz, tipo 1, cozido');
    expect(before(list, 'Arroz, tipo 1, cru', 'Arroz carreteiro')).toBe(true);
    expect(before(list, 'Arroz carreteiro', 'Baião de dois, arroz e feijão-de-corda')).toBe(true);
  });

  it('"feijão": carioca cozido primeiro, "Baião de dois" depois de todos os feijões', async () => {
    const list = await names('feijão');
    expect(list[0]).toBe('Feijão, carioca, cozido');
    expect(before(list, 'Feijão, fradinho, cru', 'Baião de dois, arroz e feijão-de-corda')).toBe(true);
  });

  it('"pao" e "pão francês" trazem o pão francês primeiro', async () => {
    expect((await names('pao'))[0]).toBe('Pão, trigo, francês');
    const frances = await names('pão francês');
    expect(frances[0]).toBe('Pão, trigo, francês');
    expect(before(frances, 'Pão, trigo, francês', 'Torrada, pão francês')).toBe(true);
  });

  it('"pao": os pães vêm antes de "Fruta-pão"', async () => {
    expect(before(await names('pao'), 'Pão, de queijo, assado', 'Fruta-pão, crua')).toBe(true);
  });

  it('"banana": banana prata primeiro', async () => {
    expect((await names('banana'))[0]).toBe('Banana, prata, crua');
  });

  it('termo sem forma padrão: o alimento vem antes de quem só o cita', async () => {
    expect(before(await names('leite'), 'Leite, de cabra', 'Chocolate, ao leite')).toBe(true);
  });

  it('sinônimo regional: "macaxeira" encontra mandioca', async () => {
    expect((await names('macaxeira'))[0]).toBe('Mandioca, cozida');
  });

  it('o que a pessoa mais registra vem primeiro, só para ela', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/v1/consents')
      .set(auth)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' })
      .expect(201);

    const search = await request(server)
      .get('/v1/foods/search')
      .query({ q: 'arroz integral cozido' })
      .set(auth);
    const integral = search.body.data.find(
      (f: { name: string }) => f.name === 'Arroz, integral, cozido',
    );
    const hoje = new Date().toISOString().slice(0, 10);
    for (const mealType of ['lunch', 'dinner']) {
      await request(server)
        .post('/v1/diary')
        .set(auth)
        .send({ foodId: integral.id, date: hoje, mealType, quantity: 100, unit: 'grams' })
        .expect(201);
    }

    expect((await names('arroz'))[0]).toBe('Arroz, integral, cozido');
    expect((await names('arroz', otherAuth))[0]).toBe('Arroz, tipo 1, cozido');
  });

  it('paginação mantém a mesma ordem e o total', async () => {
    const server = app.getHttpServer();
    const page1 = await request(server).get('/v1/foods/search').query({ q: 'feijao', limit: 3, page: 1 }).set(otherAuth);
    const page2 = await request(server).get('/v1/foods/search').query({ q: 'feijao', limit: 3, page: 2 }).set(otherAuth);
    const all = await names('feijao', otherAuth);

    expect(page1.body.meta.total).toBe(all.length);
    expect([...page1.body.data, ...page2.body.data].map((f: { name: string }) => f.name)).toEqual(all.slice(0, 6));
  });
});
