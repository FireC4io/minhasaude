import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';

import './support/behind-render-proxy';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import type { Env } from '../src/config/env.schema';
import { LOGIN_MAX_FAILURES } from '../src/auth/login-attempts/login-attempt-limiter';
import { Mailer, type MailMessage } from '../src/mail/mailer';

class CapturingMailer extends Mailer {
  readonly sent: MailMessage[] = [];
  send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }
}

/**
 * O limite por IP não segura quem troca de IP a cada tentativa: as senhas
 * erradas também contam por e-mail. Trocar a senha pelo código desbloqueia.
 */
describe('Bloqueio de login por e-mail (e2e)', () => {
  let app: NestExpressApplication;
  const mailer = new CapturingMailer();
  let ipSeq = 0;
  const nextIp = () => `198.18.0.${++ipSeq}`;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Mailer)
      .useValue(mailer)
      .compile();
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app, app.get(ConfigService<Env, true>));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.TRUST_PROXY_HOPS;
  });

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/v1/auth/login').set('X-Forwarded-For', nextIp()).send({ email, password });

  it('senhas erradas de IPs diferentes bloqueiam o e-mail, e o código de recuperação desbloqueia', async () => {
    const email = `lockout-${Date.now()}@local.test`;
    const password = 'SenhaTeste123!';
    await request(app.getHttpServer()).post('/v1/auth/register').set('X-Forwarded-For', nextIp()).send({ email, password }).expect(201);

    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      await login(email, 'SenhaErrada000').expect(401);
    }
    await login(email, password).expect(429);

    await request(app.getHttpServer()).post('/v1/auth/password-reset/request').set('X-Forwarded-For', nextIp()).send({ email }).expect(204);
    let code: string | undefined;
    for (let i = 0; i < 100 && !code; i++) {
      code = /\b(\d{6})\b/.exec(mailer.sent.find((m) => m.to === email)?.text ?? '')?.[1];
      if (!code) await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await request(app.getHttpServer())
      .post('/v1/auth/password-reset/confirm')
      .set('X-Forwarded-For', nextIp())
      .send({ email, code, newPassword: 'NovaSenha456!' })
      .expect(204);

    await login(email, 'NovaSenha456!').expect(200);
  });
});
