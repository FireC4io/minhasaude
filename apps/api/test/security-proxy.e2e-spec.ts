import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';

import './support/behind-render-proxy';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import type { Env } from '../src/config/env.schema';

/**
 * Atrás do proxy do Render, sem `trust proxy` a API enxerga o IP do proxy em
 * toda requisição: o limite de 5 logins por minuto vira um teto de todo mundo
 * junto (um atacante bloqueia o login de todos) e deixa de frear força bruta.
 *
 * O Render acrescenta o IP real ao fim do X-Forwarded-For sem limpar o que o
 * cliente mandou. Com 1 salto confiável, vale o último endereço da lista —
 * o que o cliente não consegue forjar.
 */
describe('Limite de tentativas atrás do proxy (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app, app.get(ConfigService<Env, true>));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.TRUST_PROXY_HOPS;
  });

  const wrongLogin = (forwardedFor: string) =>
    request(app.getHttpServer())
      .post('/v1/auth/login')
      .set('X-Forwarded-For', forwardedFor)
      .send({ email: 'ninguem@local.test', password: 'SenhaErrada123' });

  it('conta as tentativas de cada pessoa separadamente', async () => {
    for (let i = 0; i < 5; i++) {
      await wrongLogin('203.0.113.10').expect(401);
    }
    await wrongLogin('203.0.113.10').expect(429);

    // Outra pessoa, mesma janela de tempo: não pode herdar o bloqueio.
    await wrongLogin('203.0.113.20').expect(401);
  });

  it('não deixa o cliente escapar do bloqueio forjando o cabeçalho', async () => {
    // O atacante já bloqueado põe um IP falso no começo da lista; o proxy
    // acrescenta o real no fim, e é esse que conta.
    await wrongLogin('198.51.100.99, 203.0.113.10').expect(429);
  });
});
