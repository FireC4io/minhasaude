import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientIdForOfflineQueue1791822192710 implements MigrationInterface {
    name = 'AddClientIdForOfflineQueue1791822192710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "body_measurements" ADD "client_id" uuid`);
        await queryRunner.query(`ALTER TABLE "diary_entries" ADD "client_id" uuid`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_body_measurements_user_client" ON "body_measurements"  ("user_id", "client_id") WHERE "client_id" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_diary_entries_user_client" ON "diary_entries"  ("user_id", "client_id") WHERE "client_id" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_diary_entries_user_client"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_body_measurements_user_client"`);
        await queryRunner.query(`ALTER TABLE "diary_entries" DROP COLUMN "client_id"`);
        await queryRunner.query(`ALTER TABLE "body_measurements" DROP COLUMN "client_id"`);
    }

}
