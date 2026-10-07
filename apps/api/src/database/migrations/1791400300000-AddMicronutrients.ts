import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMicronutrients1791400300000 implements MigrationInterface {
    name = 'AddMicronutrients1791400300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "foods" ADD "micros_per_100g" jsonb`);
        await queryRunner.query(`ALTER TABLE "diary_entries" ADD "micros_snapshot" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diary_entries" DROP COLUMN "micros_snapshot"`);
        await queryRunner.query(`ALTER TABLE "foods" DROP COLUMN "micros_per_100g"`);
    }

}
