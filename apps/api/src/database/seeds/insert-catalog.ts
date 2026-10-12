import type { QueryRunner } from 'typeorm';
import { TACO_CSV_PATH, readTacoRows } from './taco-catalog';
import { TACO_PORTIONS_CSV_PATH, readTacoPortions } from './taco-portions-catalog';
import { USDA_FOODS_CSV_PATH, USDA_PORTIONS_CSV_PATH, readUsdaFoods, readUsdaPortions } from './usda-catalog';

const BATCH_SIZE = 100;

/**
 * Insere os alimentos da TACO que ainda não estão no banco, já com os
 * micronutrientes. Idempotente (`ON CONFLICT DO NOTHING` em source+external_id):
 * serve para o que o leitor passou a aceitar depois do seed original.
 */
export async function insertMissingTacoFoods(queryRunner: QueryRunner): Promise<void> {
  const { rows } = readTacoRows(TACO_CSV_PATH);
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const params: unknown[] = [];
    const values = rows.slice(start, start + BATCH_SIZE).map((row) => {
      params.push(
        row.externalId,
        row.name,
        row.kcalPer100g,
        row.proteinGPer100g,
        row.fatGPer100g,
        row.carbGPer100g,
        row.fiberGPer100g,
        JSON.stringify(row.micros),
      );
      const n = params.length;
      return `('taco', $${n - 7}, $${n - 6}, $${n - 5}, $${n - 4}, $${n - 3}, $${n - 2}, $${n - 1}, $${n}::jsonb)`;
    });
    await queryRunner.query(
      `INSERT INTO "foods" ("source", "external_id", "name", "kcal_per_100g", "protein_g_per_100g",
         "fat_g_per_100g", "carb_g_per_100g", "fiber_g_per_100g", "micros_per_100g")
       VALUES ${values.join(', ')}
       ON CONFLICT ("source", "external_id") WHERE "external_id" IS NOT NULL DO NOTHING`,
      params,
    );
  }
}

/** Medidas do IBGE nos alimentos da TACO. Idempotente pelo índice único (food_id, kind). */
export async function insertTacoPortions(queryRunner: QueryRunner): Promise<void> {
  const rows = readTacoPortions(TACO_PORTIONS_CSV_PATH);
  for (let start = 0; start < rows.length; start += BATCH_SIZE * 2) {
    const params: unknown[] = [];
    const values = rows.slice(start, start + BATCH_SIZE * 2).map((row) => {
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

/**
 * Básicos do USDA e as medidas deles. Idempotente: o alimento pelo índice
 * (source, external_id) e a medida pelo (food_id, kind).
 */
export async function insertUsdaBasics(queryRunner: QueryRunner): Promise<void> {
  const foods = readUsdaFoods(USDA_FOODS_CSV_PATH);
  for (let start = 0; start < foods.length; start += BATCH_SIZE) {
    const params: unknown[] = [];
    const values = foods.slice(start, start + BATCH_SIZE).map((row) => {
      params.push(
        row.fdcId,
        row.name,
        row.kcalPer100g,
        row.proteinGPer100g,
        row.fatGPer100g,
        row.carbGPer100g,
        row.fiberGPer100g,
        JSON.stringify(row.micros),
      );
      const n = params.length;
      return `('usda', $${n - 7}, $${n - 6}, $${n - 5}, $${n - 4}, $${n - 3}, $${n - 2}, $${n - 1}, $${n}::jsonb)`;
    });
    await queryRunner.query(
      `INSERT INTO "foods" ("source", "external_id", "name", "kcal_per_100g", "protein_g_per_100g",
         "fat_g_per_100g", "carb_g_per_100g", "fiber_g_per_100g", "micros_per_100g")
       VALUES ${values.join(', ')}
       ON CONFLICT ("source", "external_id") WHERE "external_id" IS NOT NULL DO NOTHING`,
      params,
    );
  }

  const portions = readUsdaPortions(USDA_PORTIONS_CSV_PATH);
  const params: unknown[] = [];
  const values = portions.map((row) => {
    params.push(row.fdcId, row.kind, row.grams);
    const n = params.length;
    return `($${n - 2}, $${n - 1}, $${n}::numeric)`;
  });
  if (values.length === 0) return;
  await queryRunner.query(
    `INSERT INTO "food_portions" ("food_id", "kind", "grams")
     SELECT f."id", v.kind, v.grams
       FROM (VALUES ${values.join(', ')}) AS v(fdc_id, kind, grams)
       JOIN "foods" f ON f."source" = 'usda' AND f."external_id" = v.fdc_id
     ON CONFLICT ("food_id", "kind") WHERE "kind" IS NOT NULL DO NOTHING`,
    params,
  );
}
