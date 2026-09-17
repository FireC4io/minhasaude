import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `e2e-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra uma conta nova', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(201);

    expect(response.body).toMatchObject({ email, status: 'active' });
    expect(response.body.id).toBeDefined();
  });

  it('rejeita registro duplicado', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(409);
  });

  it('rejeita login com senha errada', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password: 'senhaErrada' })
      .expect(401);
  });

  it('fluxo completo: login -> chamada autenticada -> refresh (rotação) -> logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const { accessToken, refreshToken } = loginResponse.body;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // sem token -> 401
    await request(app.getHttpServer()).get('/v1/auth/me').expect(401);

    // chamada autenticada
    const meResponse = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(meResponse.body.email).toBe(email);

    // refresh rotaciona o token
    const refreshResponse = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    const newTokens = refreshResponse.body;
    expect(newTokens.refreshToken).not.toBe(refreshToken);

    // o refresh token antigo não pode ser reutilizado (rotação)
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    // logout revoga o refresh token atual
    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${newTokens.accessToken}`)
      .send({ refreshToken: newTokens.refreshToken })
      .expect(204);

    // refresh token pós-logout não funciona mais
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: newTokens.refreshToken })
      .expect(401);
  });
});
