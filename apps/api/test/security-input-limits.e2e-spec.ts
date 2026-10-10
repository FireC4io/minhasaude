import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { createSecurityApp, newSession, type TestSession } from './support/security-app';

/**
 * Todo texto que entra na API tem tamanho máximo. Sem isso, uma senha de
 * centenas de KB ocupa o argon2 a cada tentativa, e uma busca enorme pesa no
 * banco (similaridade de trigramas) e é repassada ao Open Food Facts.
 */
describe('Tamanho máximo dos textos de entrada (e2e)', () => {
  let app: NestExpressApplication;
  let session: TestSession;
  const long = (size: number) => 'a'.repeat(size);

  beforeAll(async () => {
    app = await createSecurityApp();
    session = await newSession(app, 'limites');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${session.accessToken}` });

  it('cadastro recusa senha acima de 128 caracteres e aceita no limite', async () => {
    await http()
      .post('/v1/auth/register')
      .send({ email: `sec-longa-${Date.now()}@local.test`, password: long(129) })
      .expect(400);
    await http()
      .post('/v1/auth/register')
      .send({ email: `sec-limite-${Date.now()}@local.test`, password: long(128) })
      .expect(201);
  });

  it('login recusa senha absurda antes de chegar ao argon2', async () => {
    await http().post('/v1/auth/login').send({ email: session.email, password: long(1025) }).expect(400);
  });

  it('renovação recusa token maior que o tamanho real', async () => {
    await http().post('/v1/auth/refresh').send({ refreshToken: long(129) }).expect(400);
  });

  it('busca de alimento recusa termo acima de 100 caracteres', async () => {
    await http().get('/v1/foods/search').query({ q: long(101) }).set(auth()).expect(400);
  });

  it('alimento cadastrado recusa nome, marca e código de barras longos demais', async () => {
    const food = { kcalPer100g: 95, proteinGPer100g: 2, fatGPer100g: 1, carbGPer100g: 18 };
    await http().post('/v1/foods').set(auth()).send({ ...food, name: long(201) }).expect(400);
    await http().post('/v1/foods').set(auth()).send({ ...food, name: 'Ok', brand: long(121) }).expect(400);
    await http().post('/v1/foods').set(auth()).send({ ...food, name: 'Ok', barcode: long(33) }).expect(400);
  });

  it('consentimento recusa versão de política longa demais', async () => {
    await http()
      .post('/v1/consents')
      .set(auth())
      .send({ consentType: 'privacy_policy', policyVersion: long(33) })
      .expect(400);
  });
});
