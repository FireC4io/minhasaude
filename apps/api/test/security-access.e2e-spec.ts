import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { createSecurityApp, newSession, type TestSession } from './support/security-app';

/**
 * Controle de acesso (OWASP API1/API3/API5): ninguém alcança o que não é seu.
 * O acesso direto de B ao registro de A já está em foods/diary.e2e-spec; aqui
 * ficam os caminhos indiretos e as regras que valem para a API inteira.
 */
describe('Controle de acesso (e2e)', () => {
  let app: NestExpressApplication;
  let ana: TestSession;
  let bia: TestSession;
  let tacoFoodId: string;

  const http = () => request(app.getHttpServer());
  const as = (s: TestSession) => ({ Authorization: `Bearer ${s.accessToken}` });
  const consent = (s: TestSession) =>
    http()
      .post('/v1/consents')
      .set(as(s))
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' })
      .expect(201);

  beforeAll(async () => {
    app = await createSecurityApp();
    ana = await newSession(app, 'ana');
    bia = await newSession(app, 'bia');
    await consent(ana);
    await consent(bia);
    const search = await http().get('/v1/foods/search').query({ q: 'banana' }).set(as(ana)).expect(200);
    tacoFoodId = search.body.data.find((f: { source: string }) => f.source === 'taco').id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('sem login', () => {
    type Method = 'get' | 'post' | 'patch' | 'delete';
    const closed: [Method, string][] = [
      ['get', '/v1/me'],
      ['get', '/v1/me/export'],
      ['get', '/v1/me/progress-report'],
      ['delete', '/v1/me'],
      ['patch', '/v1/me/profile'],
      ['get', '/v1/auth/me'],
      ['post', '/v1/auth/logout'],
      ['get', '/v1/diary'],
      ['post', '/v1/diary'],
      ['post', '/v1/diary/copy'],
      ['get', '/v1/foods/search'],
      ['post', '/v1/foods'],
      ['get', '/v1/goals/current'],
      ['post', '/v1/goals/recalculate'],
      ['get', '/v1/goals/history'],
      ['get', '/v1/body-measurements'],
      ['post', '/v1/body-measurements'],
      ['get', '/v1/consents'],
      ['post', '/v1/consents'],
    ];

    it.each(closed)('%s %s recusa quem não está logado', async (method, path) => {
      await http()[method](path).expect(401);
    });

    it('recusa token assinado com outro segredo e token sem assinatura', async () => {
      const [header, payload] = ana.accessToken.split('.');
      const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${payload}.`;
      await http().get('/v1/me').set({ Authorization: `Bearer ${unsigned}` }).expect(401);
      await http().get('/v1/me').set({ Authorization: `Bearer ${header}.${payload}.assinaturaFalsa` }).expect(401);
    });
  });

  describe('alimentos da TACO são de todos e de ninguém', () => {
    it('ninguém altera nem apaga um alimento da TACO', async () => {
      await http().patch(`/v1/foods/${tacoFoodId}`).set(as(ana)).send({ kcalPer100g: 1 }).expect(404);
      await http().delete(`/v1/foods/${tacoFoodId}`).set(as(ana)).expect(404);
    });
  });

  describe('alimento cadastrado é só de quem cadastrou', () => {
    it('Bia não anota no diário o alimento cadastrado pela Ana', async () => {
      const own = await http()
        .post('/v1/foods')
        .set(as(ana))
        .send({ name: 'Bolo da vó da Ana', kcalPer100g: 300, proteinGPer100g: 5, fatGPer100g: 10, carbGPer100g: 45 })
        .expect(201);
      await http()
        .post('/v1/diary')
        .set(as(bia))
        .send({ foodId: own.body.id, date: '2026-10-10', mealType: 'lunch', quantity: 100, unit: 'grams' })
        .expect(404);
    });

    it('a busca da Bia não mostra o alimento cadastrado pela Ana', async () => {
      const search = await http().get('/v1/foods/search').query({ q: 'bolo da vo da ana' }).set(as(bia)).expect(200);
      expect(search.body.data.map((f: { name: string }) => f.name)).not.toContain('Bolo da vó da Ana');
    });
  });

  describe('ninguém escolhe o dono pelo corpo da requisição', () => {
    it('recusa userId no diário e ownerUserId/source no alimento', async () => {
      await http()
        .post('/v1/diary')
        .set(as(bia))
        .send({ foodId: tacoFoodId, date: '2026-10-10', mealType: 'lunch', quantity: 100, unit: 'grams', userId: 'x' })
        .expect(400);
      await http()
        .post('/v1/foods')
        .set(as(bia))
        .send({ name: 'Teste', kcalPer100g: 1, proteinGPer100g: 1, fatGPer100g: 1, carbGPer100g: 1, source: 'taco' })
        .expect(400);
      await http()
        .post('/v1/foods')
        .set(as(bia))
        .send({ name: 'Teste', kcalPer100g: 1, proteinGPer100g: 1, fatGPer100g: 1, carbGPer100g: 1, ownerUserId: 'x' })
        .expect(400);
    });
  });

  describe('exportação é só da própria pessoa', () => {
    it('o arquivo da Bia não contém nada da Ana', async () => {
      await http()
        .post('/v1/diary')
        .set(as(ana))
        .send({ foodId: tacoFoodId, date: '2026-10-09', mealType: 'dinner', quantity: 123, unit: 'grams' })
        .expect(201);
      const exported = await http().get('/v1/me/export').set(as(bia)).expect(200);
      const text = JSON.stringify(exported.body);
      expect(text).not.toContain(ana.email);
      expect(text).not.toContain('Bolo da vó da Ana');
    });
  });

  describe('LGPD: dado de saúde só com consentimento', () => {
    let semConsentimento: TestSession;

    beforeAll(async () => {
      semConsentimento = await newSession(app, 'sem-consent');
    });

    it('perfil (sexo, nascimento, altura) exige consentimento', async () => {
      await http()
        .patch('/v1/me/profile')
        .set(as(semConsentimento))
        .send({ birthDate: '1992-03-15', sex: 'female', heightCm: 165 })
        .expect(403);
    });

    it('diário exige consentimento', async () => {
      await http()
        .post('/v1/diary')
        .set(as(semConsentimento))
        .send({ foodId: tacoFoodId, date: '2026-10-10', mealType: 'lunch', quantity: 100, unit: 'grams' })
        .expect(403);
      await http()
        .post('/v1/diary/copy')
        .set(as(semConsentimento))
        .send({ fromDate: '2026-10-09', toDate: '2026-10-10' })
        .expect(403);
    });

    it('calcular ou mudar a meta exige consentimento', async () => {
      await http().post('/v1/goals/recalculate').set(as(semConsentimento)).expect(403);
      await http().patch('/v1/goals/current').set(as(semConsentimento)).send({}).expect(403);
    });

    it('ler o próprio dado continua permitido (direito de acesso do titular)', async () => {
      // O app pergunta pela meta logo após o cadastro: 404 é o sinal para o onboarding.
      await http().get('/v1/goals/current').set(as(semConsentimento)).expect(404);
      await http().get('/v1/diary').query({ date: '2026-10-10' }).set(as(semConsentimento)).expect(200);
    });

    it('exportar e apagar a conta funcionam mesmo sem consentimento (direito do titular)', async () => {
      await http().get('/v1/me/export').set(as(semConsentimento)).expect(200);
    });
  });

  describe('conta apagada', () => {
    it('o token de quem apagou a conta para de funcionar na hora', async () => {
      const carla = await newSession(app, 'carla');
      await http().delete('/v1/me').set(as(carla)).expect(200);
      await http().get('/v1/me').set(as(carla)).expect(401);
      await http().post('/v1/auth/refresh').send({ refreshToken: carla.refreshToken }).expect(401);
    });
  });
});
