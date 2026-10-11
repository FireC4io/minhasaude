import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

/**
 * RATE_LIMIT_DISABLED existe só para a varredura do ZAP no CI (o schema recusa
 * em produção). Sem ela, os testes security-* provam que o limite bloqueia.
 */
describe('Limite de pedidos desligado por variável (e2e)', () => {
  let app: INestApplication;
  let auth: { Authorization: string };
  const previous = process.env.RATE_LIMIT_DISABLED;

  beforeAll(async () => {
    process.env.RATE_LIMIT_DISABLED = 'true';
    // Import só depois da variável: o ConfigModule.forRoot lê o ambiente quando o
    // app.module é carregado, não quando o módulo de teste compila.
    const { AppModule } = await import('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    const server = app.getHttpServer();
    const user = { email: `sem-limite-${Date.now()}@minhasaude.app`, password: 'SenhaForte123' };
    await request(server).post('/v1/auth/register').send(user);
    const login = await request(server).post('/v1/auth/login').send(user);
    auth = { Authorization: `Bearer ${login.body.accessToken}` };
  });

  afterAll(async () => {
    await app.close();
    if (previous === undefined) delete process.env.RATE_LIMIT_DISABLED;
    else process.env.RATE_LIMIT_DISABLED = previous;
  });

  it('a busca passa do limite de 20 por minuto sem 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 25; i++) {
      const res = await request(app.getHttpServer()).get('/v1/foods/search').query({ q: 'arroz' }).set(auth);
      statuses.push(res.status);
    }
    expect(statuses.filter((status) => status === 429)).toHaveLength(0);
  });
});
