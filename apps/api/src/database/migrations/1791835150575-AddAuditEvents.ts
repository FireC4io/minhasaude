import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditEvents1791835150575 implements MigrationInterface {
    name = 'AddAuditEvents1791835150575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_events_action_enum" AS ENUM('data_exported', 'consent_revoked', 'account_deletion_requested', 'account_deleted')`);
        await queryRunner.query(`CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "action" "public"."audit_events_action_enum" NOT NULL, "details" jsonb, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d9101b537cf120c69c846bf5ef" ON "audit_events"  ("user_id", "occurred_at") `);
        // Tabela nova nasce com RLS (ver EnableRowLevelSecurity): a API REST do Supabase não lê nada.
        await queryRunner.query(`ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY`);
        // Só acréscimo: nem a API (dona da tabela) altera ou apaga um registro.
        await queryRunner.query(`CREATE FUNCTION "audit_events_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                RAISE EXCEPTION 'audit_events só aceita inserção';
            END;
        $$`);
        await queryRunner.query(`CREATE TRIGGER "audit_events_append_only" BEFORE UPDATE OR DELETE ON "audit_events"
            FOR EACH ROW EXECUTE FUNCTION "audit_events_append_only"()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER "audit_events_append_only" ON "audit_events"`);
        await queryRunner.query(`DROP FUNCTION "audit_events_append_only"()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9101b537cf120c69c846bf5ef"`);
        await queryRunner.query(`DROP TABLE "audit_events"`);
        await queryRunner.query(`DROP TYPE "public"."audit_events_action_enum"`);
    }

}
