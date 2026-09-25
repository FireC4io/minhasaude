import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AccountPurgeService } from '../src/users/account-purge.service';

/**
 * Prova que a exclusão de conta apaga os dados de verdade.
 *
 * Antes disso, `DELETE /v1/me` só marcava a conta e agendava o purge — nenhum
 * job executava, então o direito ao esquecimento (LGPD) parava no papel.
 */
describe('Exclusão de conta - purge (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let purgeService: AccountPurgeService;

  const email = `purge-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  const hoje = new Date().toISOString().slice(0, 10);
  let accessToken: string;
  let userId: string;

  // Depois do prazo de arrependimento (30 dias), pra disparar o purge sem
  // precisar mexer no relógio nem na linha do banco.
  const DEPOIS_DO_PRAZO = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

  // `foods` guarda o dono em `owner_user_id`, as demais em `user_id`.
  async function contar(tabela: string): Promise<number> {
    const coluna = tabela === 'foods' ? 'owner_user_id' : 'user_id';
    const linhas = await dataSource.query(
      `select count(*)::int as n from ${tabela} where ${coluna} = $1`,
      [userId],
    );
    return linhas[0].n;
  }

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

    dataSource = app.get(DataSource);
    purgeService = app.get(AccountPurgeService);

    const server = app.getHttpServer();
    await request(server).post('/v1/auth/register').send({ email, password });
    const login = await request(server).post('/v1/auth/login').send({ email, password });
    accessToken = login.body.accessToken;
    const auth = { Authorization: `Bearer ${accessToken}` };

    await request(server)
      .post('/v1/consents')
      .set(auth)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-01' });
    await request(server)
      .patch('/v1/me/profile')
      .set(auth)
      .send({
        birthDate: '1990-01-01',
        sex: 'female',
        heightCm: 165,
        activityLevel: 'light',
        goal: 'lose',
      });
    await request(server)
      .post('/v1/body-measurements')
      .set(auth)
      .send({ measuredAt: new Date().toISOString(), source: 'manual', weightKg: 62 });
    await request(server).post('/v1/goals/recalculate').set(auth).send({});

    const food = await request(server)
      .post('/v1/foods')
      .set(auth)
      .send({
        name: `Alimento purge ${Date.now()}`,
        kcalPer100g: 50,
        proteinGPer100g: 1,
        fatGPer100g: 1,
        carbGPer100g: 5,
      });
    await request(server)
      .post('/v1/diary')
      .set(auth)
      .send({ foodId: food.body.id, date: hoje, mealType: 'snack', quantity: 100, unit: 'grams' });

    const me = await request(server).get('/v1/me').set(auth);
    userId = me.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria dado em todas as tabelas antes da exclusão', async () => {
    expect(userId).toBeDefined();
    expect(await contar('profiles')).toBe(1);
    expect(await contar('body_measurements')).toBe(1);
    expect(await contar('goal_targets')).toBe(1);
    expect(await contar('diary_entries')).toBe(1);
    expect(await contar('consents')).toBe(1);
  });

  it('não apaga nada enquanto o prazo de arrependimento não vence', async () => {
    await request(app.getHttpServer())
      .delete('/v1/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(202);

    const resultado = await purgeService.purgeDueAccounts(new Date());

    expect(resultado.purged).toBe(0);
    expect(await contar('profiles')).toBe(1);
  });

  it('apaga o usuário e tudo que depende dele quando o prazo vence', async () => {
    const resultado = await purgeService.purgeDueAccounts(DEPOIS_DO_PRAZO);

    expect(resultado.purged).toBeGreaterThanOrEqual(1);
    expect(resultado.failed).toBe(0);

    const usuarios = await dataSource.query('select count(*)::int as n from users where id = $1', [
      userId,
    ]);
    expect(usuarios[0].n).toBe(0);

    expect(await contar('profiles')).toBe(0);
    expect(await contar('body_measurements')).toBe(0);
    expect(await contar('goal_targets')).toBe(0);
    expect(await contar('diary_entries')).toBe(0);
    expect(await contar('foods')).toBe(0);
    expect(await contar('refresh_tokens')).toBe(0);
  });

  it('mantém o consent como prova, mas sem IP nem user agent', async () => {
    const consents = await dataSource.query(
      'select ip_address, user_agent, consent_type from consents where user_id = $1',
      [userId],
    );

    expect(consents).toHaveLength(1);
    expect(consents[0].ip_address).toBeNull();
    expect(consents[0].user_agent).toBeNull();
    expect(consents[0].consent_type).toBe('privacy_policy');
  });

  it('marca o pedido de exclusão como concluído', async () => {
    const pedidos = await dataSource.query(
      'select completed_at from account_deletion_requests where user_id = $1',
      [userId],
    );

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].completed_at).not.toBeNull();
  });

  it('é idempotente: rodar de novo não reprocessa o pedido concluído', async () => {
    const resultado = await purgeService.purgeDueAccounts(DEPOIS_DO_PRAZO);

    expect(resultado.failed).toBe(0);
    const pedidos = await dataSource.query(
      'select count(*)::int as n from account_deletion_requests where user_id = $1 and completed_at is null',
      [userId],
    );
    expect(pedidos[0].n).toBe(0);
  });
});
