import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { isPortionKind, type PortionKind } from '@minhasaude/shared';

// Medidas caseiras dos alimentos da TACO, tiradas da "Tabela de Medidas
// Referidas para os Alimentos Consumidos no Brasil" (IBGE, POF 2008-2009).
// Gerado por `scripts/medidas-ibge/build.py`; cada linha guarda o item e a
// medida de origem no IBGE para conferência. Regras em
// `docs/dados/medidas-caseiras.md`.
export const TACO_PORTIONS_CSV_PATH = resolve(__dirname, 'data', 'taco-portions.csv');

export interface TacoPortionRow {
  tacoId: string;
  kind: PortionKind;
  grams: number;
}

export function readTacoPortions(csvPath: string): TacoPortionRow[] {
  const records: Record<string, string>[] = parse(readFileSync(csvPath, 'utf-8'), { columns: true });
  return records.map((record, index) => {
    const line = index + 2;
    const tacoId = record.taco_id ?? '';
    const kind = record.kind ?? '';
    const grams = Number(record.grams);
    if (!/^\d+$/.test(tacoId)) throw new Error(`taco-portions.csv:${line}: taco_id inválido`);
    if (!isPortionKind(kind)) throw new Error(`taco-portions.csv:${line}: medida desconhecida "${kind}"`);
    if (!Number.isFinite(grams) || grams <= 0) throw new Error(`taco-portions.csv:${line}: gramas inválidos`);
    return { tacoId, kind, grams };
  });
}
