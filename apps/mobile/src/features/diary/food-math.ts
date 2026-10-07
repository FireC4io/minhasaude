import type { FoodResponseDto, MacroTotalsDto } from '@/api/generated/models';

import { MEAL_TYPE_ORDER } from './meal-type-labels';

type FoodLike = Pick<
  FoodResponseDto,
  'kcalPer100g' | 'proteinGPer100g' | 'fatGPer100g' | 'carbGPer100g'
>;

/** Nutrientes de `grams` gramas a partir dos valores por 100 g. */
export function nutrientsFor(food: FoodLike, grams: number): MacroTotalsDto {
  const factor = Number.isFinite(grams) && grams > 0 ? grams / 100 : 0;
  const scale = (per100g: string) => Math.round(Number(per100g) * factor * 10) / 10;
  return {
    kcal: Math.round(Number(food.kcalPer100g) * factor),
    proteinG: scale(food.proteinGPer100g),
    fatG: scale(food.fatGPer100g),
    carbG: scale(food.carbGPer100g),
  };
}

interface EntryLike<TFood> {
  foodId: string;
  food: TFood;
  quantity: string;
}

interface DayLike<TFood> {
  meals: Record<(typeof MEAL_TYPE_ORDER)[number], EntryLike<TFood>[]>;
}

export interface RecentFood<TFood> {
  food: TFood;
  lastQuantity: number;
}

/**
 * Alimentos registrados recentemente (F4-34), do dia mais novo para o mais
 * antigo, um por alimento, com a última quantidade usada — é o que mais
 * acelera o registro do dia a dia, porque a gente come quase sempre o mesmo.
 */
export function recentFoodsFrom<TFood>(
  daysNewestFirst: readonly (DayLike<TFood> | undefined)[],
  limit: number,
): RecentFood<TFood>[] {
  const seen = new Map<string, RecentFood<TFood>>();
  for (const day of daysNewestFirst) {
    if (!day) continue;
    for (const meal of MEAL_TYPE_ORDER) {
      for (const entry of day.meals[meal]) {
        if (!seen.has(entry.foodId)) {
          seen.set(entry.foodId, { food: entry.food, lastQuantity: Number(entry.quantity) });
        }
      }
    }
  }
  return [...seen.values()].slice(0, limit);
}
