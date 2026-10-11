import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleSignIn1791730911633 implements MigrationInterface {
    name = 'AddGoogleSignIn1791730911633'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "google_sub" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_68b61ba0fb359b93b517cf1073" ON "users"  ("google_sub") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_68b61ba0fb359b93b517cf1073"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_sub"`);
    }

}
