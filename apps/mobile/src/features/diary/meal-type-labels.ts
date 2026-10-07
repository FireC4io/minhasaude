import { MealType } from '@/api/generated/models';
import { translatedLabels } from '@/i18n/labels';

export const MEAL_TYPE_ORDER: MealType[] = [
  MealType.breakfast,
  MealType.lunch,
  MealType.dinner,
  MealType.snack,
];

export const MEAL_TYPE_LABELS: Record<MealType, string> = translatedLabels({
  [MealType.breakfast]: 'labels.meal.breakfast',
  [MealType.lunch]: 'labels.meal.lunch',
  [MealType.dinner]: 'labels.meal.dinner',
  [MealType.snack]: 'labels.meal.snack',
});
