import { MigrationInterface, QueryRunner } from "typeorm";

// Gerada pelo migration:generate, que também queria apagar
// IDX_foods_search_vector e IDX_foods_source_external_id: são índices criados à
// mão. Removidos daqui, e agora declarados com `synchronize: false` na
// entidade Food para o gerador não repetir isso. Revisar sempre o que ele gera.
export class AddWeeklyPace1791400200000 implements MigrationInterface {
    name = 'AddWeeklyPace1791400200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" ADD "weekly_pace_kg" numeric(3,2)`);
        await queryRunner.query(`ALTER TABLE "goal_targets" ADD "weekly_pace_kg" numeric(3,2)`);
        await queryRunner.query(`ALTER TABLE "goal_targets" ADD "calculator_version" character varying(16) NOT NULL DEFAULT '1.0.0'`);
        await queryRunner.query(`ALTER TABLE "goal_targets" ADD "limited_by_bmr" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "goal_targets" DROP COLUMN "limited_by_bmr"`);
        await queryRunner.query(`ALTER TABLE "goal_targets" DROP COLUMN "calculator_version"`);
        await queryRunner.query(`ALTER TABLE "goal_targets" DROP COLUMN "weekly_pace_kg"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "weekly_pace_kg"`);
    }

}
