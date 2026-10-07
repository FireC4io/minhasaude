import type { DailySummaryResponseDto, MacroTotalsDto } from '@/api/generated/models';
import { dayHasEntries } from '@/features/today/use-week-entries';

export interface WeeklyAverage {
  daysLogged: number;
  average: MacroTotalsDto | null;
  target: MacroTotalsDto | null;
}

type DayLike = Pick<DailySummaryResponseDto, 'meals' | 'summary'>;

/**
 * Média da semana sobre os dias com registro. Contar dia vazio como zero
 * daria uma média enganosa para quem só esqueceu de anotar.
 */
export function weeklyAverage(days: readonly (DayLike | undefined)[]): WeeklyAverage {
  const logged = days.filter((day): day is DayLike =>
    dayHasEntries(day as DailySummaryResponseDto | undefined),
  );
  const target = [...days].reverse().find((day) => day?.summary.target)?.summary.target ?? null;

  if (logged.length === 0) return { daysLogged: 0, average: null, target };

  const sum = logged.reduce(
    (acc, day) => ({
      kcal: acc.kcal + day.summary.consumed.kcal,
      proteinG: acc.proteinG + day.summary.consumed.proteinG,
      fatG: acc.fatG + day.summary.consumed.fatG,
      carbG: acc.carbG + day.summary.consumed.carbG,
    }),
    { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
  );
  const n = logged.length;
  return {
    daysLogged: n,
    average: { kcal: sum.kcal / n, proteinG: sum.proteinG / n, fatG: sum.fatG / n, carbG: sum.carbG / n },
    target,
  };
}
