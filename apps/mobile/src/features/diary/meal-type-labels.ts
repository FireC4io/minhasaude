import { MealType } from '@/api/generated/models';

export const MEAL_TYPE_ORDER: MealType[] = [
  MealType.breakfast,
  MealType.lunch,
  MealType.dinner,
  MealType.snack,
];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.breakfast]: 'Café da manhã',
  [MealType.lunch]: 'Almoço',
  [MealType.dinner]: 'Jantar',
  [MealType.snack]: 'Lanche',
};
