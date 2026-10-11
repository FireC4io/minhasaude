import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { INPUT_LIMITS } from '@minhasaude/shared';
import { createSecurityApp } from './support/security-app';

/**
 * Relatório de erro do app: só vai para o log (Better Stack), nunca para o
 * banco. Aceita sem login (o erro pode acontecer antes dele), com campos
 * técnicos de tamanho limitado e limite de pedidos próprio.
 */
describe('Relatório de erro do app (e2e)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());
  const report = {
    message: "TypeError: Cannot read property 'kcal' of undefined",
    stack: 'at TodayScreen (index.bundle:1:2345)',
    screen: '/(app)',
    appVersion: '1.0.0 (2)',
    platform: 'android',
    fatal: false,
  };

  beforeAll(async () => {
    app = await createSecurityApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('recebe o relatório sem login e responde sem corpo', async () => {
    await http().post('/v1/client-errors').send(report).expect(204);
  });

  it('recusa campo que não é do relatório (nada de dado extra entra no log)', async () => {
    await http().post('/v1/client-errors').send({ ...report, email: 'maria@exemplo.com' }).expect(400);
  });

  it('recusa texto acima do limite e plataforma desconhecida', async () => {
    const long = 'x'.repeat(INPUT_LIMITS.clientErrorMessage + 1);
    await http().post('/v1/client-errors').send({ ...report, message: long }).expect(400);
    await http().post('/v1/client-errors').send({ ...report, platform: 'windows' }).expect(400);
  });

  it('versão e tela só nos formatos que o app manda', async () => {
    await http().post('/v1/client-errors').send({ ...report, appVersion: 'client-errors' }).expect(400);
    await http().post('/v1/client-errors').send({ ...report, appVersion: '1.0.0' }).expect(204);
    await http().post('/v1/client-errors').send({ ...report, screen: '../../etc/passwd;' }).expect(400);
    await http().post('/v1/client-errors').send({ ...report, screen: '/exam/[id]' }).expect(204);
  });

  it('para de aceitar depois de 10 relatórios por minuto do mesmo aparelho', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await http().post('/v1/client-errors').send(report)).status);
    expect(statuses).toContain(429);
  });
});
