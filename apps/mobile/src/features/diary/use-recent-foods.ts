import { useQueries } from '@tanstack/react-query';

import { getDiaryControllerGetByDateQueryOptions } from '@/api/generated/endpoints/diary/diary';
import type { FoodResponseDto } from '@/api/generated/models';

import { addDaysToIsoDate } from './date-utils';
import { recentFoodsFrom, type RecentFood } from './food-math';

const DAYS_BACK = 7;
const LIMIT = 12;

/**
 * Recentes a partir do diário dos últimos dias. Não há endpoint de recentes:
 * os dias já ficam no cache de quem navega pela tela Hoje, então quase não
 * custa requisição nova.
 */
export function useRecentFoods(date: string): {
  recents: RecentFood<FoodResponseDto>[];
  isLoading: boolean;
} {
  const days = Array.from({ length: DAYS_BACK + 1 }, (_, index) => addDaysToIsoDate(date, -index));
  const results = useQueries({
    queries: days.map((day) => getDiaryControllerGetByDateQueryOptions({ date: day })),
  });

  return {
    recents: recentFoodsFrom(
      results.map((result) => result.data),
      LIMIT,
    ),
    isLoading: results.every((result) => result.isPending),
  };
}
