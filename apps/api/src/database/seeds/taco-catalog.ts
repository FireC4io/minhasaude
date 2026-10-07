import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import type { Micros } from '@minhasaude/shared';

// CSV exportado da planilha oficial "Tabela Brasileira de Composição de
// Alimentos" (TACO, 4ª edição, NEPA/Unicamp) - crédito obrigatório na tela de
// "Sobre" do mobile (ver CLAUDE.md). Usado pelo script `seed:taco` e pela
// migration `SeedTacoFoods`, que carrega a TACO no deploy. O build copia o
// CSV para `dist` (`assets` no nest-cli.json).
export const TACO_CSV_PATH = resolve(__dirname, 'data', 'taco.csv');

// Índices de coluna no CSV (0-based) - conferidos linha a linha contra o
// cabeçalho real do arquivo (3 linhas de cabeçalho mesclado no topo).
const COL = {
  id: 0,
  name: 1,
  kcal: 3,
  protein: 5,
  fat: 6,
  carb: 8,
  fiber: 9,
  calcium: 11,
  magnesium: 12,
  iron: 16,
  sodium: 17,
  potassium: 18,
  zinc: 20,
  vitaminARae: 23,
  vitaminC: 28,
} as const;

export interface TacoRow {
  externalId: string;
  name: string;
  kcalPer100g: number;
  proteinGPer100g: number;
  fatGPer100g: number;
  carbGPer100g: number;
  fiberGPer100g: number | null;
  /** Chaves de `MICRONUTRIENTS` do shared; null = não medido na TACO. */
  micros: Micros;
}

// "Tr" (traço) é quantidade desprezível -> 0. "NA"/vazio/"*" significa que o
// nutriente não foi medido para esse item -> null (nunca vira 0, que seria um
// dado inventado - ver política de dado de exame em CLAUDE.md, mesma lógica
// se aplica aqui: nunca fabricar um valor que a fonte não mediu).
function parseNutrient(value: string | undefined): number | null {
  const v = (value ?? '').trim();
  if (v === 'Tr') return 0;
  if (v === '' || v === 'NA' || v === '*') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function isFoodRow(row: string[]): boolean {
  return /^\d+$/.test((row[COL.id] ?? '').trim());
}

function isGroupRow(row: string[]): boolean {
  const id = (row[COL.id] ?? '').trim();
  const name = (row[COL.name] ?? '').trim();
  if (!id || name) return false;
  if (/^\d+$/.test(id)) return false;
  if (id === 'Número do' || id === 'Alimento') return false;
  return true;
}

export function readTacoRows(csvPath: string): { rows: TacoRow[]; skipped: string[] } {
  const csvText = readFileSync(csvPath, 'utf-8');
  const records: string[][] = parse(csvText, { relax_column_count: true });

  const rows: TacoRow[] = [];
  const skipped: string[] = [];
  let insideFoodSection = false;

  for (const record of records) {
    if (record.length < 10) continue;
    if (isGroupRow(record)) {
      insideFoodSection = true;
      continue;
    }
    if (!insideFoodSection || !isFoodRow(record)) continue;

    const name = (record[COL.name] ?? '').trim();
    if (!name) continue;

    const kcalPer100g = parseNutrient(record[COL.kcal]);
    const proteinGPer100g = parseNutrient(record[COL.protein]);
    const fatGPer100g = parseNutrient(record[COL.fat]);
    const carbGPer100g = parseNutrient(record[COL.carb]);
    const fiberGPer100g = parseNutrient(record[COL.fiber]);

    if (kcalPer100g === null || proteinGPer100g === null || fatGPer100g === null || carbGPer100g === null) {
      skipped.push(`${record[COL.id]} - ${name} (macro obrigatório não medido na fonte)`);
      continue;
    }

    rows.push({
      externalId: (record[COL.id] ?? '').trim(),
      name,
      kcalPer100g,
      proteinGPer100g,
      fatGPer100g,
      carbGPer100g,
      fiberGPer100g,
      micros: {
        fiberG: fiberGPer100g,
        sodiumMg: parseNutrient(record[COL.sodium]),
        potassiumMg: parseNutrient(record[COL.potassium]),
        calciumMg: parseNutrient(record[COL.calcium]),
        ironMg: parseNutrient(record[COL.iron]),
        magnesiumMg: parseNutrient(record[COL.magnesium]),
        zincMg: parseNutrient(record[COL.zinc]),
        vitaminCMg: parseNutrient(record[COL.vitaminC]),
        vitaminARaeMcg: parseNutrient(record[COL.vitaminARae]),
      },
    });
  }

  return { rows, skipped };
}

