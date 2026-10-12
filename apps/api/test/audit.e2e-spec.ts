import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Auditoria das ações sensíveis (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  const email = `audit-${Date.now()}@minhasaude.app`;
  const password = 'SenhaForte123';
  let accessToken: string;
  let userId: string;

  const actionsOf = async (id: string): Promise<string[]> =>
    (
      await db.query(`SELECT "action" FROM "audit_events" WHERE "user_id" = $1 ORDER BY "occurred_at", "action"`, [id])
    ).map((row: { action: string }) => row.action);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    db = app.get(DataSource);

    await request(app.getHttpServer()).post('/v1/auth/register').send({ email, password });
    const login = await request(app.getHttpServer()).post('/v1/auth/login').send({ email, password });
    accessToken = login.body.accessToken;
    const me = await request(app.getHttpServer()).get('/v1/me').set('Authorization', `Bearer ${accessToken}`);
    userId = me.body.user.id;

    await request(app.getHttpServer())
      .post('/v1/consents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ consentType: 'privacy_policy', policyVersion: '2026-10' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('exportar e revogar consentimento ficam registrados, e o histórico entra na exportação', async () => {
    await request(app.getHttpServer()).get('/v1/me/export').set('Authorization', `Bearer ${accessToken}`).expect(200);
    await request(app.getHttpServer())
      .delete('/v1/consents/privacy_policy')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    expect(await actionsOf(userId)).toEqual(['data_exported', 'consent_revoked']);

    const second = await request(app.getHttpServer())
      .get('/v1/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const exported = second.body.auditEvents.map((event: { action: string }) => event.action);
    expect(exported).toEqual(['data_exported', 'consent_revoked']);
    expect(second.body.auditEvents[1].details).toEqual({ consentType: 'privacy_policy' });
  });

  it('o banco recusa alterar ou apagar um registro', async () => {
    await expect(db.query(`UPDATE "audit_events" SET "action" = 'data_exported' WHERE "user_id" = $1`, [userId])).rejects.toThrow(
      /só aceita inserção/,
    );
    await expect(db.query(`DELETE FROM "audit_events" WHERE "user_id" = $1`, [userId])).rejects.toThrow(/só aceita inserção/);
  });

  it('apagar a conta deixa o registro do pedido e da conclusão, sem e-mail', async () => {
    await request(app.getHttpServer()).delete('/v1/me').set('Authorization', `Bearer ${accessToken}`).expect(200);

    const [user] = await db.query(`SELECT 1 FROM "users" WHERE "id" = $1`, [userId]);
    expect(user).toBeUndefined();
    const actions = await actionsOf(userId);
    expect(actions).toEqual(
      expect.arrayContaining(['data_exported', 'consent_revoked', 'account_deletion_requested', 'account_deleted']),
    );
    const rows: { details: unknown }[] = await db.query(`SELECT "details" FROM "audit_events" WHERE "user_id" = $1`, [userId]);
    expect(JSON.stringify(rows)).not.toContain(email);
  });
});
