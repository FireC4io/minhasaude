import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { DataSource } from 'typeorm';

import './support/behind-render-proxy';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import type { Env } from '../src/config/env.schema';
import { Mailer, type MailMessage } from '../src/mail/mailer';
import { RESET_CODE_MAX_ATTEMPTS, RESET_CODES_PER_HOUR } from '../src/auth/password-reset/password-reset.service';

/** Guarda os e-mails em vez de enviar. O envio corre fora da resposta, então o teste espera por ele. */
class FakeMailer extends Mailer {
  readonly sent: MailMessage[] = [];

  send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  async waitFor(to: string, count = 1): Promise<MailMessage> {
    for (let i = 0; i < 100; i++) {
      const mine = this.sent.filter((m) => m.to === to);
      const message = mine[count - 1];
      if (message) return message;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`nenhum e-mail para ${to}`);
  }

  /** Dá tempo ao trabalho em segundo plano antes de afirmar que nada saiu. */
  async settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

const PASSWORD = 'SenhaTeste123!';
const NEW_PASSWORD = 'OutraSenha456!';

describe('Recuperar senha (e2e)', () => {
  let app: NestExpressApplication;
  const mailer = new FakeMailer();
  // Cada teste vem de um IP diferente: o limite por IP (3/min) é testado à parte.
  let ipSeq = 0;
  const nextIp = () => `203.0.113.${++ipSeq}`;

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

  const http = () => request(app.getHttpServer());

  async function newAccount(label: string) {
    const email = `reset-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@local.test`;
    const ip = nextIp();
    await http().post('/v1/auth/register').set('X-Forwarded-For', ip).send({ email, password: PASSWORD }).expect(201);
    const login = await http()
      .post('/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASSWORD })
      .expect(200);
    return { email, refreshToken: login.body.refreshToken as string };
  }

  const askCode = (email: string, ip = nextIp(), extra: Record<string, unknown> = {}) =>
    http().post('/v1/auth/password-reset/request').set('X-Forwarded-For', ip).send({ email, ...extra });

  const confirm = (body: Record<string, unknown>, ip = nextIp()) =>
    http().post('/v1/auth/password-reset/confirm').set('X-Forwarded-For', ip).send(body);

  const codeFrom = (message: MailMessage) => /\b(\d{6})\b/.exec(message.text)![1];

  it('responde igual para e-mail sem conta e não manda nada', async () => {
    const email = `ninguem-${Date.now()}@local.test`;
    const response = await askCode(email).expect(204);
    expect(response.body).toEqual({});
    await mailer.settle();
    expect(mailer.sent.filter((m) => m.to === email)).toHaveLength(0);
  });

  it('troca a senha com o código, derruba as sessões e o código não serve de novo', async () => {
    const { email, refreshToken } = await newAccount('fluxo');
    await askCode(email).expect(204);
    const code = codeFrom(await mailer.waitFor(email));

    await confirm({ email, code, newPassword: NEW_PASSWORD }).expect(204);
    // Aviso de segurança: a dona da conta fica sabendo da troca.
    expect((await mailer.waitFor(email, 2)).subject).toBe('Sua senha do Gota Vital foi trocada');
    const [row] = await app.get(DataSource).query('SELECT email_verified_at FROM users WHERE email = $1', [email]);
    expect(row.email_verified_at).not.toBeNull();

    await http().post('/v1/auth/login').set('X-Forwarded-For', nextIp()).send({ email, password: PASSWORD }).expect(401);
    await http().post('/v1/auth/login').set('X-Forwarded-For', nextIp()).send({ email, password: NEW_PASSWORD }).expect(200);
    await http().post('/v1/auth/refresh').set('X-Forwarded-For', nextIp()).send({ refreshToken }).expect(401);

    await confirm({ email, code, newPassword: 'MaisUma789!' }).expect(400);
  });

  it('manda o e-mail no idioma pedido pelo app', async () => {
    const { email } = await newAccount('idioma');
    await askCode(email, nextIp(), { language: 'es' }).expect(204);
    expect((await mailer.waitFor(email)).subject).toMatch(/contraseña/);
  });

  it(`o código morre depois de ${RESET_CODE_MAX_ATTEMPTS} tentativas erradas`, async () => {
    const { email } = await newAccount('tentativas');
    await askCode(email).expect(204);
    const code = codeFrom(await mailer.waitFor(email));
    const wrong = code === '000000' ? '111111' : '000000';

    for (let i = 0; i < RESET_CODE_MAX_ATTEMPTS; i++) {
      await confirm({ email, code: wrong, newPassword: NEW_PASSWORD }).expect(400);
    }
    await confirm({ email, code, newPassword: NEW_PASSWORD }).expect(400);
  });

  it('só o código mais novo vale', async () => {
    const { email } = await newAccount('novo');
    await askCode(email).expect(204);
    const first = codeFrom(await mailer.waitFor(email, 1));
    await askCode(email).expect(204);
    const second = codeFrom(await mailer.waitFor(email, 2));

    if (first !== second) {
      await confirm({ email, code: first, newPassword: NEW_PASSWORD }).expect(400);
    }
    await confirm({ email, code: second, newPassword: NEW_PASSWORD }).expect(204);
  });

  it(`manda no máximo ${RESET_CODES_PER_HOUR} códigos por hora para a mesma conta`, async () => {
    const { email } = await newAccount('limite');
    for (let i = 1; i <= RESET_CODES_PER_HOUR; i++) {
      await askCode(email).expect(204);
      await mailer.waitFor(email, i);
    }
    await askCode(email).expect(204);
    await mailer.settle();
    expect(mailer.sent.filter((m) => m.to === email)).toHaveLength(RESET_CODES_PER_HOUR);
  });

  it('recusa código fora do formato, senha curta e campo a mais', async () => {
    const email = `formato-${Date.now()}@local.test`;
    await confirm({ email, code: '12ab56', newPassword: NEW_PASSWORD }).expect(400);
    await confirm({ email, code: '123456', newPassword: 'curta' }).expect(400);
    await confirm({ email, code: '123456', newPassword: NEW_PASSWORD, admin: true }).expect(400);
    await askCode(email, nextIp(), { language: 'fr' }).expect(400);
  });

  it('limita os pedidos de código por IP', async () => {
    const ip = nextIp();
    for (let i = 0; i < 3; i++) {
      await askCode(`ip-${i}-${Date.now()}@local.test`, ip).expect(204);
    }
    await askCode(`ip-x-${Date.now()}@local.test`, ip).expect(429);
  });
});
