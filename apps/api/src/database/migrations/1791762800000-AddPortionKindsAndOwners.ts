import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Medidas caseiras ganham dois tipos: as do sistema (`kind`, vindas do IBGE)
 * e as criadas pela pessoa (`user_id` + `label`). A tabela estava vazia até
 * aqui — nenhum alimento tinha medida.
 */
export class AddPortionKindsAndOwners1791762800000 implements MigrationInterface {
  name = 'AddPortionKindsAndOwners1791762800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "food_portions" ADD "kind" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "food_portions" ADD "user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "food_portions" ALTER COLUMN "label" DROP NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_026deff8a6916cb478e228e515" ON "food_portions" ("user_id") `);
    await queryRunner.query(
      `ALTER TABLE "food_portions" ADD CONSTRAINT "CHK_food_portions_kind_or_owner" CHECK (("kind" IS NOT NULL AND "user_id" IS NULL) OR ("kind" IS NULL AND "user_id" IS NOT NULL AND "label" IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "food_portions" ADD CONSTRAINT "FK_026deff8a6916cb478e228e5156" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // Uma medida de cada tipo por alimento (só as do sistema).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_food_portions_food_kind" ON "food_portions" ("food_id", "kind") WHERE "kind" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_food_portions_food_kind"`);
    await queryRunner.query(`ALTER TABLE "food_portions" DROP CONSTRAINT "FK_026deff8a6916cb478e228e5156"`);
    await queryRunner.query(`ALTER TABLE "food_portions" DROP CONSTRAINT "CHK_food_portions_kind_or_owner"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_026deff8a6916cb478e228e515"`);
    await queryRunner.query(`DELETE FROM "food_portions" WHERE "label" IS NULL`);
    await queryRunner.query(`ALTER TABLE "food_portions" ALTER COLUMN "label" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "food_portions" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "food_portions" DROP COLUMN "kind"`);
  }
}
