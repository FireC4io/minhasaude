import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Foods search (e2e)', () => {
  let app: INestApplication;
  const email = `foods-search-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  let accessToken: string;

  const otherEmail = `foods-search-other-${Date.now()}@minhasaude.app`;
  let otherAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    await request(app.getHttpServer()).post('/v1/auth/register').send({ email, password });
    const login = await request(app.getHttpServer()).post('/v1/auth/login').send({ email, password });
    accessToken = login.body.accessToken;

    await request(app.getHttpServer()).post('/v1/auth/register').send({ email: otherEmail, password });
    const otherLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: otherEmail, password });
    otherAccessToken = otherLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('encontra "Arroz, integral, cozido" buscando "arros" (sem acento, com erro de digitação)', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q: 'arros' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.meta.total).toBeGreaterThan(0);
    const names: string[] = response.body.data.map((f: { name: string }) => f.name);
    expect(names).toContain('Arroz, integral, cozido');
  });

  it('encontra alimentos com acento buscando sem acento ("acucar" -> "Açúcar")', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q: 'acucar' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const names: string[] = response.body.data.map((f: { name: string }) => f.name);
    expect(names.some((n) => n.toLowerCase().includes('açúcar'))).toBe(true);
  });

  it('não retorna alimento custom de outro usuário na busca', async () => {
    const uniqueName = `Receita secreta ${Date.now()}`;
    await request(app.getHttpServer())
      .post('/v1/foods')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ name: uniqueName, kcalPer100g: 100, proteinGPer100g: 1, fatGPer100g: 1, carbGPer100g: 1 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q: uniqueName.toLowerCase() })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.meta.total).toBe(0);
  });

  it('rejeita busca com menos de 2 caracteres (400)', async () => {
    await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q: 'a' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });
});
