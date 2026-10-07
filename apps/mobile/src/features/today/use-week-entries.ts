import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getDiaryControllerGetByDateQueryOptions } from '@/api/generated/endpoints/diary/diary';
import type { DailySummaryResponseDto } from '@/api/generated/models';
import { weekOf } from '@/features/diary/date-utils';
import { MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';

export const dayHasEntries = (day: DailySummaryResponseDto | undefined): boolean =>
  day ? MEAL_TYPE_ORDER.some((meal) => day.meals[meal].length > 0) : false;

/**
 * Quais dias da semana exibida têm registro. Reaproveita o cache do dia: a
 * tela já busca o dia aberto, e os outros seis ficam guardados ao navegar.
 */
export function useWeekEntries(date: string): ReadonlySet<string> {
  const week = weekOf(date);
  const results = useQueries({
    queries: week.map((day) => getDiaryControllerGetByDateQueryOptions({ date: day })),
  });

  const signature = results.map((result) => (dayHasEntries(result.data) ? '1' : '0')).join('');
  return useMemo(
    () => new Set(week.filter((_, index) => signature[index] === '1')),
    // `week` muda junto com `date`; a assinatura evita recriar o Set a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date, signature],
  );
}
