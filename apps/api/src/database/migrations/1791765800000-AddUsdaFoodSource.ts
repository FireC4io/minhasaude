import { MigrationInterface, QueryRunner } from 'typeorm';

/** Nova origem de alimento: USDA FoodData Central (básicos que a TACO não tem). */
export class AddUsdaFoodSource1791765800000 implements MigrationInterface {
  name = 'AddUsdaFoodSource1791765800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."foods_source_enum" ADD VALUE IF NOT EXISTS 'usda'`);
  }

  // O Postgres não tira valor de enum. Os alimentos 'usda' saem no down da SeedUsdaBasics;
  // o valor fica sem uso, o que não muda nada.
  public async down(): Promise<void> {}
}
