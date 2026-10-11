import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { DataSource } from 'typeorm';

import './support/behind-render-proxy';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import type { Env } from '../src/config/env.schema';
import {
  GoogleTokenVerifier,
  type GoogleIdentity,
} from '../src/auth/google/google-token-verifier';

/** Cada "token" é uma chave para a identidade que o Google devolveria. */
class FakeGoogleVerifier extends GoogleTokenVerifier {
  readonly identities = new Map<string, GoogleIdentity>();

  verify(idToken: string): Promise<GoogleIdentity | null> {
    return Promise.resolve(this.identities.get(idToken) ?? null);
  }
}

const PASSWORD = 'SenhaTeste123!';

describe('Entrar com o Google (e2e)', () => {
  let app: NestExpressApplication;
  const verifier = new FakeGoogleVerifier();
  let ipSeq = 0;
  const nextIp = () => `198.51.100.${++ipSeq}`;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GoogleTokenVerifier)
      .useValue(verifier)
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
  const unique = (label: string) => `google-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  function googleToken(identity: GoogleIdentity): string {
    const token = `token-${identity.sub}`;
    verifier.identities.set(token, identity);
    return token;
  }

  const signIn = (idToken: string) =>
    http().post('/v1/auth/google').set('X-Forwarded-For', nextIp()).send({ idToken });

  const passwordLogin = (email: string, password: string) =>
    http().post('/v1/auth/login').set('X-Forwarded-For', nextIp()).send({ email, password });

  async function register(email: string) {
    const ip = nextIp();
    await http().post('/v1/auth/register').set('X-Forwarded-For', ip).send({ email, password: PASSWORD }).expect(201);
    const login = await passwordLogin(email, PASSWORD).expect(200);
    return login.body.refreshToken as string;
  }

  it('cria a conta na primeira vez e entra na mesma conta depois', async () => {
    const label = unique('nova');
    const token = googleToken({ sub: label, email: `${label}@gmail.com`, emailVerified: true });

    const first = await signIn(token).expect(200);
    const me = await http().get('/v1/me').set('Authorization', `Bearer ${first.body.accessToken}`).expect(200);
    const second = await signIn(token).expect(200);
    const meAgain = await http().get('/v1/me').set('Authorization', `Bearer ${second.body.accessToken}`).expect(200);

    expect(meAgain.body.user.id).toBe(me.body.user.id);
    expect(me.body.user.email).toBe(`${label}@gmail.com`);
  });

  it('conta criada pelo Google não entra com senha nenhuma', async () => {
    const label = unique('semsenha');
    await signIn(googleToken({ sub: label, email: `${label}@gmail.com`, emailVerified: true })).expect(200);
    await passwordLogin(`${label}@gmail.com`, PASSWORD).expect(401);
  });

  it('recusa token que não confere e e-mail não confirmado no Google', async () => {
    await signIn('token-falso').expect(401);
    const label = unique('naoconfirmado');
    await signIn(googleToken({ sub: label, email: `${label}@gmail.com`, emailVerified: false })).expect(401);
  });

  it('ligar o Google a conta sem e-mail confirmado apaga a senha antiga e derruba as sessões', async () => {
    // Pré-sequestro: alguém criou a conta com o e-mail da vítima antes dela.
    const label = unique('presequestro');
    const email = `${label}@gmail.com`;
    const attackerRefresh = await register(email);

    await signIn(googleToken({ sub: label, email, emailVerified: true })).expect(200);

    await passwordLogin(email, PASSWORD).expect(401);
    await http().post('/v1/auth/refresh').set('X-Forwarded-For', nextIp()).send({ refreshToken: attackerRefresh }).expect(401);
  });

  it('conta que já provou ser dona do e-mail continua com a senha ao ligar o Google', async () => {
    const label = unique('confirmada');
    const email = `${label}@gmail.com`;
    await register(email);
    // Como depois de usar o código de recuperar senha.
    await app.get(DataSource).query('UPDATE users SET email_verified_at = now() WHERE email = $1', [email]);

    await signIn(googleToken({ sub: label, email, emailVerified: true })).expect(200);

    await passwordLogin(email, PASSWORD).expect(200);
  });

  it('acha a conta pelo e-mail sem diferenciar maiúsculas', async () => {
    const label = unique('caixa');
    await register(`${label.toUpperCase()}@Gmail.com`);
    const google = await signIn(googleToken({ sub: label, email: `${label}@gmail.com`, emailVerified: true })).expect(200);
    const me = await http().get('/v1/me').set('Authorization', `Bearer ${google.body.accessToken}`).expect(200);
    expect(me.body.user.email).toBe(`${label.toUpperCase()}@Gmail.com`);
  });

  it('recusa corpo sem token ou com campo a mais', async () => {
    await http().post('/v1/auth/google').set('X-Forwarded-For', nextIp()).send({}).expect(400);
    await http().post('/v1/auth/google').set('X-Forwarded-For', nextIp()).send({ idToken: 'x', email: 'a@b.com' }).expect(400);
  });
});
