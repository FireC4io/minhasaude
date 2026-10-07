import { MigrationInterface, QueryRunner } from 'typeorm';
import { TACO_CSV_PATH, readTacoRows } from '../seeds/taco-catalog';

const BATCH_SIZE = 100;

/**
 * Carrega a TACO no banco como parte do deploy. Antes ela só entrava pelo
 * script `seed:taco`, rodado à mão — e nunca foi rodado em produção.
 *
 * Idempotente: `ON CONFLICT DO NOTHING` no índice único (source, external_id),
 * então em banco que já tem a TACO (ambiente local) não muda nada.
 */
export class SeedTacoFoods1791400000000 implements MigrationInterface {
  name = 'SeedTacoFoods1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { rows } = readTacoRows(TACO_CSV_PATH);

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      const batch = rows.slice(start, start + BATCH_SIZE);
      const params: unknown[] = [];
      const values = batch.map((row) => {
        const base = params.length;
        params.push(
          row.externalId,
          row.name,
          row.kcalPer100g,
          row.proteinGPer100g,
          row.fatGPer100g,
          row.carbGPer100g,
          row.fiberGPer100g,
        );
        const p = (i: number): string => `$${base + i}`;
        return `('taco', ${p(1)}, ${p(2)}, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)})`;
      });

      await queryRunner.query(
        `INSERT INTO "foods" ("source", "external_id", "name", "kcal_per_100g", "protein_g_per_100g",
           "fat_g_per_100g", "carb_g_per_100g", "fiber_g_per_100g")
         VALUES ${values.join(', ')}
         ON CONFLICT ("source", "external_id") WHERE "external_id" IS NOT NULL DO NOTHING`,
        params,
      );
    }
  }

  // Só a TACO sai; alimentos do Open Food Facts e os da pessoa ficam.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "foods" WHERE "source" = 'taco'
         AND NOT EXISTS (SELECT 1 FROM "diary_entries" d WHERE d."food_id" = "foods"."id")`,
    );
  }
}
