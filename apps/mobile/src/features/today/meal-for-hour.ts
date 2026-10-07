import type { MealType } from '@/api/generated/models';

/** Refeição mais provável para a hora — só ordena as opções, nunca decide sozinha. */
export function mealForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  return 'dinner';
}
