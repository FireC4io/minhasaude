import type {
  DailySummaryResponseDto,
  DiaryEntryResponseDto,
  MacroTotalsDto,
} from '@/api/generated/models';
import { nutrientsFor } from '@/features/diary/food-math';

import type { PendingDiaryItem } from './pending-item';

const PENDING_ID_PREFIX = 'pending:';

export function isPendingEntry(entry: Pick<DiaryEntryResponseDto, 'id'>): boolean {
  return entry.id.startsWith(PENDING_ID_PREFIX);
}

export function pendingClientId(entry: Pick<DiaryEntryResponseDto, 'id'>): string | null {
  return isPendingEntry(entry) ? entry.id.slice(PENDING_ID_PREFIX.length) : null;
}

function gramsOfItem(item: PendingDiaryItem): number {
  const { quantity, unit } = item.data;
  return unit === 'portion' && item.portion ? quantity * Number(item.portion.grams) : quantity;
}

/** A anotação guardada no aparelho no formato que a tela já sabe mostrar. */
export function pendingEntry(item: PendingDiaryItem): DiaryEntryResponseDto {
  const nutrients = nutrientsFor(item.food, gramsOfItem(item));
  return {
    id: PENDING_ID_PREFIX + item.clientId,
    clientId: item.clientId,
    foodId: item.data.foodId,
    food: item.food,
    entryDate: item.data.date,
    mealType: item.data.mealType,
    quantity: String(item.data.quantity),
    unit: item.data.unit,
    portionId: item.data.portionId ?? null,
    portion: item.portion,
    kcalSnapshot: String(nutrients.kcal),
    proteinGSnapshot: String(nutrients.proteinG),
    fatGSnapshot: String(nutrients.fatG),
    carbGSnapshot: String(nutrients.carbG),
    microsSnapshot: null,
  };
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function addTotals(base: MacroTotalsDto, extra: MacroTotalsDto, sign: 1 | -1): MacroTotalsDto {
  return {
    kcal: round2(base.kcal + sign * extra.kcal),
    proteinG: round2(base.proteinG + sign * extra.proteinG),
    fatG: round2(base.fatG + sign * extra.fatG),
    carbG: round2(base.carbG + sign * extra.carbG),
  };
}

/**
 * O dia do servidor com as anotações que ainda esperam a internet: elas
 * aparecem na refeição e entram nas calorias. A que já chegou ao servidor
 * (resposta perdida, mesmo `clientId`) não conta duas vezes. Micronutrientes
 * ficam com o que o servidor somou.
 */
export function withPendingEntries(
  day: DailySummaryResponseDto,
  items: readonly PendingDiaryItem[],
): DailySummaryResponseDto {
  const onServer = new Set(
    Object.values(day.meals)
      .flat()
      .map((entry) => entry.clientId)
      .filter(Boolean),
  );
  const extra = items
    .filter((item) => item.data.date === day.date && !onServer.has(item.clientId))
    .map(pendingEntry);
  if (extra.length === 0) return day;

  const meals = { ...day.meals };
  for (const entry of extra) {
    meals[entry.mealType] = [...meals[entry.mealType], entry];
  }
  const added = extra.reduce<MacroTotalsDto>(
    (sum, entry) =>
      addTotals(
        sum,
        {
          kcal: Number(entry.kcalSnapshot),
          proteinG: Number(entry.proteinGSnapshot),
          fatG: Number(entry.fatGSnapshot),
          carbG: Number(entry.carbGSnapshot),
        },
        1,
      ),
    { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
  );

  return {
    ...day,
    meals,
    summary: {
      ...day.summary,
      consumed: addTotals(day.summary.consumed, added, 1),
      remaining: day.summary.remaining ? addTotals(day.summary.remaining, added, -1) : null,
    },
  };
}
