import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Foods (e2e)', () => {
  let app: INestApplication;
  const email = `foods-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  let accessToken: string;

  const otherEmail = `foods-other-${Date.now()}@minhasaude.app`;
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

  it('cadastra um alimento personalizado com source=custom, ignorando qualquer source enviado pelo cliente', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/foods')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Vitamina de banana caseira',
        kcalPer100g: 95,
        proteinGPer100g: 2.1,
        fatGPer100g: 1.5,
        carbGPer100g: 18,
      })
      .expect(201);

    expect(response.body.source).toBe('custom');
    expect(response.body.name).toBe('Vitamina de banana caseira');
  });

  it('rejeita campo não whitelisted como source/ownerUserId forjado pelo cliente (400)', async () => {
    await request(app.getHttpServer())
      .post('/v1/foods')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Tentativa de forjar source',
        kcalPer100g: 100,
        proteinGPer100g: 1,
        fatGPer100g: 1,
        carbGPer100g: 1,
        source: 'taco',
      })
      .expect(400);
  });

  it('dono consegue ver, editar e remover o próprio alimento; outro usuário recebe 404 em tudo', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/foods')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Bolo de fubá da vó',
        kcalPer100g: 320,
        proteinGPer100g: 5,
        fatGPer100g: 10,
        carbGPer100g: 55,
      })
      .expect(201);
    const foodId = created.body.id;

    await request(app.getHttpServer())
      .get(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ name: 'Tentativa de editar alimento alheio' })
      .expect(404);

    const updated = await request(app.getHttpServer())
      .patch(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ kcalPer100g: 310 })
      .expect(200);
    expect(Number(updated.body.kcalPer100g)).toBe(310);
    expect(updated.body.name).toBe('Bolo de fubá da vó');

    await request(app.getHttpServer())
      .delete(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/v1/foods/${foodId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('GET /v1/foods/:id com id inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .get('/v1/foods/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
