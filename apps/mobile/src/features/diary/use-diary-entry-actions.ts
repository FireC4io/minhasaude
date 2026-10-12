import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerRemove,
  useDiaryControllerUpdate,
} from '@/api/generated/endpoints/diary/diary';
import type { FoodResponseDto, MealType } from '@/api/generated/models';
import { savePendingItem } from '@/features/offline-queue/offline-queue';

import { MEAL_TYPE_LABELS } from './meal-type-labels';
import type { EntryQuantity, PortionLike } from './measures';

/**
 * Criar, mudar a quantidade e apagar uma anotação do diário, com o anúncio
 * para o leitor de tela e o dia buscado de novo. Falha sobe para a tela
 * mostrar. Criar passa pela fila: sem internet, a anotação fica guardada no
 * aparelho.
 */
export function useDiaryEntryActions(date: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const updateEntry = useDiaryControllerUpdate();
  const removeEntry = useDiaryControllerRemove();
  const [isCreating, setIsCreating] = useState(false);

  function invalidateDay() {
    return queryClient.invalidateQueries({ queryKey: getDiaryControllerGetByDateQueryKey({ date }) });
  }

  async function create(food: FoodResponseDto, mealType: MealType, amount: EntryQuantity, portion: PortionLike | null) {
    const clientId = randomUUID();
    setIsCreating(true);
    const result = await savePendingItem({
      kind: 'diary',
      clientId,
      createdAt: new Date().toISOString(),
      data: { foodId: food.id, date, mealType, ...amount, clientId },
      food,
      portion,
    }).finally(() => setIsCreating(false));
    // Anúncio antes de fechar: a confirmação do registro chega mesmo com a tela sumindo.
    AccessibilityInfo.announceForAccessibility(
      result === 'sent'
        ? t('diary.added', { food: food.name, meal: MEAL_TYPE_LABELS[mealType].toLowerCase() })
        : t('offline.diaryQueued', { food: food.name }),
    );
    // Guardada sem internet: buscar o dia agora só faria esperar o servidor que não respondeu.
    if (result === 'sent') await invalidateDay();
  }

  async function update(id: string, amount: EntryQuantity) {
    await updateEntry.mutateAsync({ id, data: amount });
    AccessibilityInfo.announceForAccessibility(t('diary.quantityUpdated'));
    await invalidateDay();
  }

  async function remove(id: string, foodName: string) {
    await removeEntry.mutateAsync({ id });
    AccessibilityInfo.announceForAccessibility(t('diary.removedAnnounce', { food: foodName }));
    await invalidateDay();
  }

  return {
    create,
    update,
    remove,
    isSaving: isCreating || updateEntry.isPending,
    isRemoving: removeEntry.isPending,
  };
}
