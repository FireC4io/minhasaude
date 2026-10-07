import { MICRONUTRIENT_KEYS, emptyMicros, type Micros } from '@minhasaude/shared';
import type { Food } from '../database/entities/food.entity';

/**
 * Micronutrientes por 100 g de um alimento, no formato completo do shared.
 * Fibras: o jsonb manda; sem ele, cai na coluna antiga `fiber_g_per_100g`
 * (alimentos custom e do Open Food Facts cacheados antes do jsonb).
 */
export function foodMicrosPer100g(food: Pick<Food, 'microsPer100g' | 'fiberGPer100g'>): Micros {
  const stored = food.microsPer100g ?? {};
  const micros = emptyMicros();
  for (const key of MICRONUTRIENT_KEYS) {
    const value = stored[key];
    micros[key] = typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  if (micros.fiberG === null && food.fiberGPer100g !== null) {
    micros.fiberG = Number(food.fiberGPer100g);
  }
  return micros;
}
