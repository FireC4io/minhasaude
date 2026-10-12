import { MigrationInterface, QueryRunner } from 'typeorm';
import { TACO_PORTIONS_CSV_PATH, readTacoPortions } from '../seeds/taco-portions-catalog';

const BATCH_SIZE = 200;

/**
 * Carrega as medidas caseiras do IBGE nos alimentos da TACO. Idempotente:
 * o índice único (food_id, kind) faz o `ON CONFLICT` ignorar o que já existe.
 */
export class SeedIbgePortions1791762900000 implements MigrationInterface {
  name = 'SeedIbgePortions1791762900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = readTacoPortions(TACO_PORTIONS_CSV_PATH);

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      const batch = rows.slice(start, start + BATCH_SIZE);
      const params: unknown[] = [];
      const values = batch.map((row) => {
        params.push(row.tacoId, row.kind, row.grams);
        const n = params.length;
        return `($${n - 2}, $${n - 1}, $${n}::numeric)`;
      });

      await queryRunner.query(
        `INSERT INTO "food_portions" ("food_id", "kind", "grams")
         SELECT f."id", v.kind, v.grams
           FROM (VALUES ${values.join(', ')}) AS v(taco_id, kind, grams)
           JOIN "foods" f ON f."source" = 'taco' AND f."external_id" = v.taco_id
         ON CONFLICT ("food_id", "kind") WHERE "kind" IS NOT NULL DO NOTHING`,
        params,
      );
    }
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
