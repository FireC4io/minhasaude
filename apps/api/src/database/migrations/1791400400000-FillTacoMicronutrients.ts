import { MigrationInterface, QueryRunner } from 'typeorm';
import { MICRONUTRIENT_KEYS, scaleMicros, type Micros } from '@minhasaude/shared';
import { TACO_CSV_PATH, readTacoRows } from '../seeds/taco-catalog';

const BATCH_SIZE = 100;

/**
 * Preenche os micronutrientes da TACO (item 7 do plano) e recalcula o snapshot
 * das entradas de diário que já existiam, a partir da quantidade em gramas.
 *
 * O snapshot de macros continua intocado — só ganha os micronutrientes que
 * ainda não tinha. Entrada de alimento sem micronutriente medido fica com
 * tudo null (nunca zero inventado).
 */
export class FillTacoMicronutrients1791400400000 implements MigrationInterface {
  name = 'FillTacoMicronutrients1791400400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { rows } = readTacoRows(TACO_CSV_PATH);

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      const batch = rows.slice(start, start + BATCH_SIZE);
      const params: unknown[] = [];
      const values = batch.map((row) => {
        params.push(row.externalId, JSON.stringify(row.micros));
        return `($${params.length - 1}, $${params.length}::jsonb)`;
      });
      await queryRunner.query(
        `UPDATE "foods" f SET "micros_per_100g" = v.micros
           FROM (VALUES ${values.join(', ')}) AS v(external_id, micros)
          WHERE f."source" = 'taco' AND f."external_id" = v.external_id`,
        params,
      );
    }

    const entries: {
      id: string;
      quantity: string;
      unit: string;
      portion_grams: string | null;
      micros: Partial<Micros> | null;
      fiber: string | null;
    }[] = await queryRunner.query(
      `SELECT d."id", d."quantity", d."unit", p."grams" AS portion_grams,
              f."micros_per_100g" AS micros, f."fiber_g_per_100g" AS fiber
         FROM "diary_entries" d
         JOIN "foods" f ON f."id" = d."food_id"
         LEFT JOIN "food_portions" p ON p."id" = d."portion_id"
        WHERE d."micros_snapshot" IS NULL`,
    );

    for (const entry of entries) {
      const grams =
        entry.unit === 'grams'
          ? Number(entry.quantity)
          : Number(entry.quantity) * Number(entry.portion_grams ?? NaN);
      if (!Number.isFinite(grams)) continue;

      const per100g = Object.fromEntries(
        MICRONUTRIENT_KEYS.map((key) => [key, entry.micros?.[key] ?? null]),
      ) as Micros;
      if (per100g.fiberG === null && entry.fiber !== null) per100g.fiberG = Number(entry.fiber);

      await queryRunner.query(`UPDATE "diary_entries" SET "micros_snapshot" = $1::jsonb WHERE "id" = $2`, [
        JSON.stringify(scaleMicros(per100g, grams)),
        entry.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "diary_entries" SET "micros_snapshot" = NULL`);
    await queryRunner.query(`UPDATE "foods" SET "micros_per_100g" = NULL WHERE "source" = 'taco'`);
  }
}
