import { MigrationInterface, QueryRunner } from 'typeorm';
import { insertTacoPortions } from '../seeds/insert-catalog';

/**
 * Carrega as medidas caseiras do IBGE nos alimentos da TACO. Idempotente:
 * o índice único (food_id, kind) faz o `ON CONFLICT` ignorar o que já existe.
 */
export class SeedIbgePortions1791762900000 implements MigrationInterface {
  name = 'SeedIbgePortions1791762900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTacoPortions(queryRunner);
  }

  // Entradas do diário que usavam uma medida do sistema ficam em gramas
  // (o snapshot nutricional não muda).
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "diary_entries" d SET "quantity" = d."quantity" * p."grams", "unit" = 'grams', "portion_id" = NULL
         FROM "food_portions" p WHERE d."portion_id" = p."id" AND p."kind" IS NOT NULL`,
    );
    await queryRunner.query(`DELETE FROM "food_portions" WHERE "kind" IS NOT NULL`);
  }
}
