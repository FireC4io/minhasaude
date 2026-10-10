import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import type { Env } from '../../src/config/env.schema';

/** API montada exatamente como em produção (`configureApp`), para os testes de segurança. */
export async function createSecurityApp(): Promise<NestExpressApplication> {
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  configureApp(app, app.get(ConfigService<Env, true>));
  await app.init();
  return app;
}

export interface TestSession {
  email: string;
  accessToken: string;
  refreshToken: string;
}

/** Cria uma conta nova e devolve os tokens. Cada chamada é uma pessoa diferente. */
export async function newSession(app: NestExpressApplication, label: string): Promise<TestSession> {
  const email = `sec-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@local.test`;
  const password = 'SenhaTeste123!';
  await request(app.getHttpServer()).post('/v1/auth/register').send({ email, password }).expect(201);
  const login = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return { email, accessToken: login.body.accessToken, refreshToken: login.body.refreshToken };
}
