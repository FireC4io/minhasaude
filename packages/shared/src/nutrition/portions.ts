import { z } from 'zod';

/**
 * Medidas caseiras (colher, unidade, fatia...). O código fica em inglês e é
 * estável: o texto que a pessoa vê vem da tradução do app, então 'colher de
 * sopa' vira 'tablespoon' e 'cucharada' sem mudar nada no banco.
 *
 * As medidas dos alimentos da TACO vêm da Tabela de Medidas Referidas da
 * POF 2008-2009 (IBGE) — ver `docs/dados/medidas-caseiras.md`.
 */
export const PORTION_KINDS = [
  'unit',
  'slice',
  'piece',
  'tablespoon',
  'dessert_spoon',
  'teaspoon',
  'serving_spoon',
  'ladle',
  'skimmer',
  'cup',
  'coffee_cup',
  'glass',
  'large_glass',
  'can',
  'steak',
  'fillet',
  'leaf',
  'handful',
  'knife_tip',
  'package',
] as const;

export type PortionKind = (typeof PORTION_KINDS)[number];

export function isPortionKind(value: string): value is PortionKind {
  return (PORTION_KINDS as readonly string[]).includes(value);
}

/** Onça avoirdupois (a dos rótulos nos EUA), em gramas. */
export const OUNCE_GRAMS = 28.349523125;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function gramsFromOunces(ounces: number): number {
  return round2(ounces * OUNCE_GRAMS);
}

export function ouncesFromGrams(grams: number): number {
  return round2(grams / OUNCE_GRAMS);
}

/** Medida criada pela pessoa ('minha xícara = 180 g'). A API espelha estes limites. */
export const PORTION_LIMITS = {
  labelMax: 40,
  gramsMin: 0.1,
  gramsMax: 2000,
  /** Por alimento e por pessoa: evita lista sem fim na tela de quantidade. */
  customPerFood: 10,
} as const;

/** Medida criada pela pessoa, como o app valida antes de mandar. */
export const customPortionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .max(PORTION_LIMITS.labelMax)
    .regex(/^[^<>]*$/),
  grams: z.number().min(PORTION_LIMITS.gramsMin).max(PORTION_LIMITS.gramsMax),
});

export type CustomPortionValues = z.infer<typeof customPortionSchema>;
