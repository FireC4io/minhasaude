import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Frutas: a regra "cozido antes de cru" da busca punha suco, polpa ou doce na
 * frente da fruta ("laranja" trazia o suco). Arquivo próprio porque a busca
 * aceita 20 pedidos por minuto, e a suíte de relevância já chega perto disso.
 */
describe('Foods search - frutas (e2e)', () => {
  let app: INestApplication;
  let auth: { Authorization: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const server = app.getHttpServer();
    const email = `frutas-${Date.now()}@minhasaude.app`;
    const password = 'SenhaForte123';
    await request(server).post('/v1/auth/register').send({ email, password });
    const res = await request(server).post('/v1/auth/login').send({ email, password });
    auth = { Authorization: `Bearer ${res.body.accessToken}` };
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['mamão', 'Mamão, Papaia, cru'],
    ['laranja', 'Laranja, pêra, crua'],
    ['abacaxi', 'Abacaxi, cru'],
    ['manga', 'Manga, Tommy Atkins, crua'],
    ['uva', 'Uva, Itália, crua'],
    ['goiaba', 'Goiaba, vermelha, com casca, crua'],
  ])('"%s": a fruta, não suco, polpa ou doce', async (q, fruta) => {
    const res = await request(app.getHttpServer())
      .get('/v1/foods/search')
      .query({ q, limit: 5 })
      .set(auth)
      .expect(200);

    expect(res.body.data[0].name).toBe(fruta);
  });
});
