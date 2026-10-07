import {
  MICRONUTRIENT_KEYS,
  scaleMicros,
  type MicronutrientKey,
  type MicroTotals,
  type Micros,
} from '@minhasaude/shared';

import type { MicroRow } from './micros-panel';
import { partialNote } from './micros-format';

/** Linhas do painel para uma quantidade de um alimento (valores por 100 g). */
export function rowsForPortion(per100g: Micros, grams: number): Record<MicronutrientKey, MicroRow> {
  const scaled = scaleMicros(per100g, grams);
  return Object.fromEntries(
    MICRONUTRIENT_KEYS.map((key) => [key, { amount: scaled[key] }]),
  ) as Record<MicronutrientKey, MicroRow>;
}

/** Linhas do painel para o total do dia; sem nenhum dado, mostra "sem dado". */
export function rowsForDay(totals: MicroTotals): Record<MicronutrientKey, MicroRow> {
  return Object.fromEntries(
    MICRONUTRIENT_KEYS.map((key) => {
      const total = totals[key];
      return [
        key,
        { amount: total.itemsWithData === 0 ? null : total.amount, note: partialNote(total) },
      ];
    }),
  ) as Record<MicronutrientKey, MicroRow>;
}
