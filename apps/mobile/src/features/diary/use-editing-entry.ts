import { useEffect, useRef } from 'react';

import { useDiaryControllerGetByDate } from '@/api/generated/endpoints/diary/diary';
import type { DiaryEntryResponseDto } from '@/api/generated/models';

import { MEAL_TYPE_ORDER } from './meal-type-labels';
import { measureFromEntry, type Measure } from './measures';

/**
 * A anotação sendo editada, tirada do dia já em cache (para a conta de
 * calorias). Quando ela chega, avisa uma vez a medida e a quantidade em que
 * foi anotada, para a tela abrir do jeito que a pessoa deixou.
 */
export function useEditingEntry(
  date: string,
  id: string | undefined,
  onLoaded: (saved: { measure: Measure; amount: number }) => void,
): DiaryEntryResponseDto | undefined {
  const dayQuery = useDiaryControllerGetByDate({ date }, { query: { enabled: Boolean(id) } });
  const entry = id
    ? MEAL_TYPE_ORDER.flatMap((meal) => dayQuery.data?.meals[meal] ?? []).find((item) => item.id === id)
    : undefined;

  // Uma vez só: depois disso a quantidade é da pessoa, mesmo se o dia for buscado de novo.
  const loaded = useRef(false);
  useEffect(() => {
    if (!entry || loaded.current) return;
    loaded.current = true;
    onLoaded(measureFromEntry(entry));
  }, [entry, onLoaded]);

  return entry;
}
