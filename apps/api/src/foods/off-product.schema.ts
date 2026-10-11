import { z } from 'zod';
import { INPUT_LIMITS } from '@minhasaude/shared';

export interface OffNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
  fiber_100g?: number;
  // Minerais e vitamina C vêm em gramas por 100 g no OFF.
  sodium_100g?: number;
  potassium_100g?: number;
  calcium_100g?: number;
  iron_100g?: number;
  magnesium_100g?: number;
  zinc_100g?: number;
  'vitamin-c_100g'?: number;
}

export interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: OffNutriments;
}

// Valores fisicamente possíveis por 100 g: gordura pura tem ~900 kcal, e nenhum
// nutriente passa de 100 g em 100 g. Fora disso é erro de cadastro no OFF.
const MAX_KCAL = 900;
const MAX_GRAMS = 100;

const NUTRIENT_KEYS: (keyof OffNutriments)[] = [
  'energy-kcal_100g',
  'proteins_100g',
  'fat_100g',
  'carbohydrates_100g',
  'fiber_100g',
  'sodium_100g',
  'potassium_100g',
  'calcium_100g',
  'iron_100g',
  'magnesium_100g',
  'zinc_100g',
  'vitamin-c_100g',
];

const amount = (max: number) => z.coerce.number().finite().min(0).max(max);
const text = (max: number) =>
  // Sem < e >, como no cadastro manual: o nome volta na exportação LGPD.
  z.string().transform((value) => value.replace(/[<>]/g, '').trim().slice(0, max)).pipe(z.string().min(1));
const gtin = z.string().regex(/^\d{8,14}$/);
const productShape = z.object({ code: z.unknown(), product_name: z.unknown(), brands: z.unknown(), nutriments: z.unknown() }).partial();

function pick<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

function parseNutriments(raw: unknown): OffNutriments | undefined {
  if (raw === null || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const nutriments: OffNutriments = {};
  for (const key of NUTRIENT_KEYS) {
    if (source[key] === undefined || source[key] === null || source[key] === '') continue;
    const value = pick(amount(key === 'energy-kcal_100g' ? MAX_KCAL : MAX_GRAMS), source[key]);
    if (value !== undefined) nutriments[key] = value;
  }
  return Object.keys(nutriments).length > 0 ? nutriments : undefined;
}

/**
 * Resposta do Open Food Facts validada campo a campo (dado de fora não é
 * confiável): número que veio como texto é convertido, valor impossível é
 * descartado, nome e marca respeitam os limites do cadastro manual e código
 * fora do padrão GTIN é ignorado. Item que não é produto some da lista.
 */
export function parseOffProducts(body: unknown): OffProduct[] {
  const list = pick(z.object({ products: z.array(z.unknown()) }), body)?.products ?? [];
  const products: OffProduct[] = [];
  for (const item of list) {
    const raw = pick(productShape, item);
    if (!raw || item === null || typeof item !== 'object') continue;
    const product: OffProduct = {};
    const code = pick(gtin, raw.code);
    const name = pick(text(INPUT_LIMITS.foodName), raw.product_name);
    const brands = pick(text(INPUT_LIMITS.foodBrand), raw.brands);
    const nutriments = parseNutriments(raw.nutriments);
    if (code) product.code = code;
    if (name) product.product_name = name;
    if (brands) product.brands = brands;
    if (nutriments) product.nutriments = nutriments;
    products.push(product);
  }
  return products;
}
