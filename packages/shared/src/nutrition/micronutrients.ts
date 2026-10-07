/**
 * Micronutrientes (item 7 do plano, 2026-10-07): os que a TACO mede e que
 * importam no dia a dia. Valores por 100 g no alimento; na entrada do diário,
 * já escalados para a quantidade (snapshot imutável, como os macros).
 *
 * `null` = a fonte não mediu. Nunca vira zero: seria um dado inventado (mesma
 * política do import da TACO). Por isso a soma do dia diz quantos itens tinham
 * o dado — a tela mostra "parcial" em vez de um total que parece completo.
 *
 * Só quantidades, sem comparação com metas ou limites: informativo, nunca
 * diagnóstico (RDC 657/2022).
 */
export const MICRONUTRIENTS = {
  fiberG: { label: 'Fibras', unit: 'g' },
  sodiumMg: { label: 'Sódio', unit: 'mg' },
  potassiumMg: { label: 'Potássio', unit: 'mg' },
  calciumMg: { label: 'Cálcio', unit: 'mg' },
  ironMg: { label: 'Ferro', unit: 'mg' },
  magnesiumMg: { label: 'Magnésio', unit: 'mg' },
  zincMg: { label: 'Zinco', unit: 'mg' },
  vitaminCMg: { label: 'Vitamina C', unit: 'mg' },
  vitaminARaeMcg: { label: 'Vitamina A', unit: 'mcg' },
} as const satisfies Record<string, { label: string; unit: 'g' | 'mg' | 'mcg' }>;

export type MicronutrientKey = keyof typeof MICRONUTRIENTS;
export const MICRONUTRIENT_KEYS = Object.keys(MICRONUTRIENTS) as MicronutrientKey[];

export type Micros = Record<MicronutrientKey, number | null>;

export interface MicroTotal {
  amount: number;
  /** Quantos itens do dia tinham esse nutriente medido. */
  itemsWithData: number;
  items: number;
}

export type MicroTotals = Record<MicronutrientKey, MicroTotal>;

const round2 = (value: number): number => Math.round(value * 100) / 100;

export function emptyMicros(): Micros {
  return Object.fromEntries(MICRONUTRIENT_KEYS.map((key) => [key, null])) as Micros;
}

export function scaleMicros(per100g: Micros, grams: number): Micros {
  const factor = grams / 100;
  return Object.fromEntries(
    MICRONUTRIENT_KEYS.map((key) => {
      const value = per100g[key];
      return [key, value === null ? null : round2(value * factor)];
    }),
  ) as Micros;
}

/** `null` na lista = entrada sem snapshot de micronutrientes (conta como sem dado). */
export function sumMicros(entries: readonly (Micros | null)[]): MicroTotals {
  return Object.fromEntries(
    MICRONUTRIENT_KEYS.map((key) => {
      const values = entries.map((e) => e?.[key] ?? null).filter((v): v is number => v !== null);
      const total: MicroTotal = {
        amount: round2(values.reduce((acc, v) => acc + v, 0)),
        itemsWithData: values.length,
        items: entries.length,
      };
      return [key, total];
    }),
  ) as MicroTotals;
}
