import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { createSecurityApp, newSession, type TestSession } from './support/security-app';

/**
 * Parâmetro de URL fora do formato tem de virar 400 na borda, não chegar ao
 * banco: antes, `DELETE /v1/consents/qualquer` e ids que não são UUID davam
 * 500 (achado do OWASP ZAP, 2026-10-11).
 */
describe('Parâmetros de URL validados (e2e)', () => {
  let app: NestExpressApplication;
  let session: TestSession;

  beforeAll(async () => {
    app = await createSecurityApp();
    session = await newSession(app, 'params');
    // Com consentimento: as rotas que alteram dado de saúde passam pelo guard e chegam à validação.
    await request(app.getHttpServer())
      .post('/v1/consents')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-10' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${session.accessToken}`);

  it('tipo de consentimento desconhecido', async () => {
    await auth(request(app.getHttpServer()).delete('/v1/consents/type')).expect(400);
  });

  it.each([
    ['DELETE', '/v1/diary/nao-e-uuid'],
    ['PATCH', '/v1/diary/nao-e-uuid'],
    ['GET', '/v1/foods/nao-e-uuid'],
    ['PATCH', '/v1/foods/nao-e-uuid'],
    ['DELETE', '/v1/foods/nao-e-uuid'],
  ])('%s %s com id que não é UUID', async (method, path) => {
    const server = request(app.getHttpServer());
    const call = method === 'DELETE' ? server.delete(path) : method === 'PATCH' ? server.patch(path).send({}) : server.get(path);
    await auth(call).expect(400);
  });
});
