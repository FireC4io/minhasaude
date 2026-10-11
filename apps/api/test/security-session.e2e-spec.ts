import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';

import './support/behind-render-proxy';
import { createSecurityApp, newSession } from './support/security-app';

/**
 * Refresh token usado duas vezes é sinal de roubo: quem tem a cópia antiga
 * não pode seguir renovando. Passada a janela de tolerância (resposta perdida
 * em internet ruim), o reuso derruba todas as sessões da pessoa.
 */
describe('Reuso de refresh token (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createSecurityApp();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.TRUST_PROXY_HOPS;
  });

  // Cada teste vem de um IP: o limite de 5 renovações por minuto por IP é testado em outro lugar.
  let ip = '';
  let ipSeq = 0;
  beforeEach(() => {
    ip = `192.0.2.${++ipSeq}`;
  });

  const refresh = (refreshToken: string) =>
    request(app.getHttpServer()).post('/v1/auth/refresh').set('X-Forwarded-For', ip).send({ refreshToken });

  /** Simula que a troca aconteceu há mais tempo que a janela de tolerância. */
  async function ageRevocation(email: string) {
    await app.get(DataSource).query(
      `UPDATE refresh_tokens SET revoked_at = now() - interval '10 minutes'
       WHERE revoked_at IS NOT NULL AND user_id = (SELECT id FROM users WHERE email = $1)`,
      [email],
    );
  }

  it('reuso depois da janela derruba todas as sessões, inclusive a do token novo', async () => {
    const session = await newSession(app, 'reuso');
    const rotated = await refresh(session.refreshToken).expect(200);
    await ageRevocation(session.email);

    await refresh(session.refreshToken).expect(401);

    await refresh(rotated.body.refreshToken).expect(401);
  });

  it('reuso logo depois da troca (resposta perdida) só é recusado, sem derrubar a sessão nova', async () => {
    const session = await newSession(app, 'janela');
    const rotated = await refresh(session.refreshToken).expect(200);

    await refresh(session.refreshToken).expect(401);

    await refresh(rotated.body.refreshToken).expect(200);
  });

  it('dois pedidos simultâneos com o mesmo token: só um ganha token novo', async () => {
    const session = await newSession(app, 'corrida');
    const results = await Promise.all([refresh(session.refreshToken), refresh(session.refreshToken)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
  });
});
