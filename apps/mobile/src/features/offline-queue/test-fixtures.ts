import type { DailySummaryResponseDto, FoodResponseDto } from '@/api/generated/models';

import type { PendingDiaryItem, PendingWeightItem } from './pending-item';

export const rice: FoodResponseDto = {
  id: 'food-rice',
  name: 'Arroz cozido',
  source: 'taco',
  kcalPer100g: '128',
  proteinGPer100g: '2.5',
  fatGPer100g: '0.2',
  carbGPer100g: '28',
  micros: {} as FoodResponseDto['micros'],
};

export function diaryItem(clientId: string, overrides: Partial<PendingDiaryItem['data']> = {}): PendingDiaryItem {
  return {
    kind: 'diary',
    clientId,
    createdAt: '2026-10-12T12:00:00.000Z',
    data: { foodId: rice.id, date: '2026-10-12', mealType: 'lunch', quantity: 100, unit: 'grams', clientId, ...overrides },
    food: rice,
    portion: null,
  };
}

export function weightItem(clientId: string, weightKg = 70): PendingWeightItem {
  return {
    kind: 'weight',
    clientId,
    createdAt: '2026-10-12T12:00:00.000Z',
    data: { measuredAt: '2026-10-12T12:00:00.000Z', source: 'manual', weightKg, clientId },
  };
}

export function emptyDay(date = '2026-10-12'): DailySummaryResponseDto {
  return {
    date,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
    summary: {
      consumed: { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
      target: { kcal: 2000, proteinG: 100, fatG: 60, carbG: 250 },
      remaining: { kcal: 2000, proteinG: 100, fatG: 60, carbG: 250 },
      micros: {} as DailySummaryResponseDto['summary']['micros'],
    },
  };
}

/** Erro como o axios entrega: sem `response` é falta de conexão. */
export function axiosError(status?: number): Error {
  return Object.assign(new Error('falhou'), {
    isAxiosError: true,
    response: status === undefined ? undefined : { status },
  });
}

/** Armazenamento em memória no lugar do AsyncStorage cifrado. */
export function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: async (key: string) => {
      data.delete(key);
    },
  };
}
