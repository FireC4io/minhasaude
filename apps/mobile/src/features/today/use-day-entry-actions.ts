import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCopy,
  useDiaryControllerCreate,
  useDiaryControllerRemove,
} from '@/api/generated/endpoints/diary/diary';
import type { DiaryEntryResponseDto } from '@/api/generated/models';
import { addDaysToIsoDate } from '@/features/diary/date-utils';
import { pendingClientId } from '@/features/offline-queue/merge-pending';
import { pendingStore } from '@/features/offline-queue/offline-queue';

/**
 * O que a tela Hoje faz com as anotações do dia: remover (com "Desfazer",
 * F4-16) e copiar o dia anterior. A anotação guardada sem internet só sai da
 * fila, sem "Desfazer".
 */
export function useDayEntryActions(date: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const copyDay = useDiaryControllerCopy();
  const removeEntry = useDiaryControllerRemove();
  const createEntry = useDiaryControllerCreate();
  const [removed, setRemoved] = useState<DiaryEntryResponseDto | null>(null);

  const invalidateDay = useCallback(
    () => queryClient.invalidateQueries({ queryKey: getDiaryControllerGetByDateQueryKey({ date }) }),
    [queryClient, date],
  );

  async function remove(entry: DiaryEntryResponseDto) {
    const clientId = pendingClientId(entry);
    if (clientId) {
      // Ainda não foi enviada: basta tirar da fila.
      await pendingStore.remove(clientId);
      AccessibilityInfo.announceForAccessibility(t('diary.removedAnnounce', { food: entry.food.name }));
      return;
    }
    await removeEntry.mutateAsync({ id: entry.id });
    setRemoved(entry);
    await invalidateDay();
  }

  async function undoRemove() {
    const entry = removed;
    setRemoved(null);
    if (!entry) return;
    await createEntry.mutateAsync({
      data: {
        foodId: entry.foodId,
        date: entry.entryDate,
        mealType: entry.mealType,
        quantity: Number(entry.quantity),
        unit: entry.unit,
        ...(entry.portionId ? { portionId: entry.portionId } : {}),
      },
    });
    await invalidateDay();
  }

  async function copyPreviousDay() {
    await copyDay.mutateAsync({ data: { fromDate: addDaysToIsoDate(date, -1), toDate: date } });
    await invalidateDay();
  }

  const dismissUndo = useCallback(() => setRemoved(null), []);

  return { remove, removed, undoRemove, dismissUndo, copyPreviousDay, isCopying: copyDay.isPending };
}
