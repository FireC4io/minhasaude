import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetCodes1791727535740 implements MigrationInterface {
    name = 'AddPasswordResetCodes1791727535740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password_reset_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "code_hash" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "used_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f3a88f7bc4536c53f2b277a0b56" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_421ca49f5a7b180365035267ca" ON "password_reset_codes"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "password_reset_codes" ADD CONSTRAINT "FK_421ca49f5a7b180365035267ca6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // Tabela nova nasce com RLS (ver EnableRowLevelSecurity): a API REST do Supabase não lê nada.
        await queryRunner.query(`ALTER TABLE "password_reset_codes" ENABLE ROW LEVEL SECURITY`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_codes" DROP CONSTRAINT "FK_421ca49f5a7b180365035267ca6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_421ca49f5a7b180365035267ca"`);
        await queryRunner.query(`DROP TABLE "password_reset_codes"`);
    }

}
