import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { isPortionKind, type Micros, type PortionKind } from '@minhasaude/shared';

// Básicos do dia a dia que a TACO não tem, do USDA FoodData Central (domínio
// público, CC0). Gerados por `scripts/alimentos-usda/build.py` a partir da
// lista revisada pelo dono; regras em `docs/dados/alimentos-usda.md`.
export const USDA_FOODS_CSV_PATH = resolve(__dirname, 'data', 'usda-foods.csv');
export const USDA_PORTIONS_CSV_PATH = resolve(__dirname, 'data', 'usda-portions.csv');

export interface UsdaFoodRow {
  /** fdc_id do USDA: vira o external_id, para conferir na fonte. */
  fdcId: string;
  name: string;
  kcalPer100g: number;
  proteinGPer100g: number;
  fatGPer100g: number;
  carbGPer100g: number;
  fiberGPer100g: number | null;
  micros: Micros;
}

export interface UsdaPortionRow {
  fdcId: string;
  kind: PortionKind;
  grams: number;
}

function read(csvPath: string): Record<string, string>[] {
  return parse(readFileSync(csvPath, 'utf-8'), { columns: true });
}

// Vazio = a fonte não mediu: fica null, nunca zero.
function optional(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function required(value: string | undefined, field: string, line: number): number {
  const n = optional(value);
  if (n === null || n < 0) throw new Error(`usda-foods.csv:${line}: ${field} inválido`);
  return n;
}

export function readUsdaFoods(csvPath: string): UsdaFoodRow[] {
  return read(csvPath).map((r, index) => {
    const line = index + 2;
    const fdcId = r.fdc_id ?? '';
    const name = (r.name ?? '').trim();
    if (!/^\d+$/.test(fdcId)) throw new Error(`usda-foods.csv:${line}: fdc_id inválido`);
    if (!name || /[<>]/.test(name)) throw new Error(`usda-foods.csv:${line}: nome inválido`);
    const fiberG = optional(r.fiber_g);
    return {
      fdcId,
      name,
      kcalPer100g: required(r.kcal, 'kcal', line),
      proteinGPer100g: required(r.protein_g, 'protein_g', line),
      fatGPer100g: required(r.fat_g, 'fat_g', line),
      carbGPer100g: required(r.carb_g, 'carb_g', line),
      fiberGPer100g: fiberG,
      micros: {
        fiberG,
        sodiumMg: optional(r.sodium_mg),
        potassiumMg: optional(r.potassium_mg),
        calciumMg: optional(r.calcium_mg),
        ironMg: optional(r.iron_mg),
        magnesiumMg: optional(r.magnesium_mg),
        zincMg: optional(r.zinc_mg),
        vitaminCMg: optional(r.vitamin_c_mg),
        vitaminARaeMcg: optional(r.vitamin_a_rae_mcg),
      },
    };
  });
}

export function readUsdaPortions(csvPath: string): UsdaPortionRow[] {
  return read(csvPath).map((r, index) => {
    const line = index + 2;
    const kind = r.kind ?? '';
    const grams = Number(r.grams);
    if (!/^\d+$/.test(r.fdc_id ?? '')) throw new Error(`usda-portions.csv:${line}: fdc_id inválido`);
    if (!isPortionKind(kind)) throw new Error(`usda-portions.csv:${line}: medida desconhecida "${kind}"`);
    if (!Number.isFinite(grams) || grams <= 0) throw new Error(`usda-portions.csv:${line}: gramas inválidos`);
    return { fdcId: r.fdc_id ?? '', kind, grams };
  });
}
