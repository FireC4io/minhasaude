import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCopy,
  useDiaryControllerGetByDate,
  useDiaryControllerRemove,
} from '@/api/generated/endpoints/diary/diary';
import type { DiaryEntryResponseDto, MealType } from '@/api/generated/models';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';
import { addDaysToIsoDate, formatIsoDateLabel, todayIsoDate } from '@/features/diary/date-utils';
import { MacroSummary } from '@/features/diary/macro-summary';
import { MealSection } from '@/features/diary/meal-section';
import { MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';
import { AppText } from '@/components/ui/app-text';

export default function DiaryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(todayIsoDate());

  const dayQuery = useDiaryControllerGetByDate({ date: currentDate });
  const copyDay = useDiaryControllerCopy();
  const removeEntry = useDiaryControllerRemove();

  function invalidateDay() {
    return queryClient.invalidateQueries({
      queryKey: getDiaryControllerGetByDateQueryKey({ date: currentDate }),
    });
  }

  // Quem navega pelas setas continua com o foco na seta: sem o anúncio, o
  // leitor não diz para qual dia foi. Aqui não há liveRegion, então não
  // duplica no Android.
  function showDate(date: string) {
    setCurrentDate(date);
    AccessibilityInfo.announceForAccessibility(formatIsoDateLabel(date));
  }

  function goToEntry(mealType: MealType) {
    router.push({ pathname: '/diary-entry', params: { date: currentDate, mealType } });
  }

  function editEntry(entry: DiaryEntryResponseDto) {
    router.push({
      pathname: '/diary-entry',
      params: {
        id: entry.id,
        date: currentDate,
        foodName: entry.food.name,
        quantity: entry.quantity,
      },
    });
  }

  async function deleteEntry(entry: DiaryEntryResponseDto) {
    await removeEntry.mutateAsync({ id: entry.id });
    await invalidateDay();
  }

  async function copyPreviousDay() {
    await copyDay.mutateAsync({
      data: { fromDate: addDaysToIsoDate(currentDate, -1), toDate: currentDate },
    });
    await invalidateDay();
  }

  const dateLabel = formatIsoDateLabel(currentDate);
  const isToday = currentDate === todayIsoDate();
  const summary = dayQuery.data;
  const hasEntries = summary
    ? MEAL_TYPE_ORDER.some((mealType) => summary.meals[mealType].length > 0)
    : false;

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <View className="flex-row items-center justify-between px-6 pt-2">
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          Diário
        </AppText>
      </View>

      <View className="flex-row items-center justify-between px-6 py-1">
        {/* As setas eram só "‹" e "›" — o leitor anunciava um caractere sem
            significado, ou nada. */}
        <TextButton
          label="‹"
          accessibilityLabel="Dia anterior"
          onPress={() => showDate(addDaysToIsoDate(currentDate, -1))}
          className="items-center"
          textVariant="subtitle"
          textClassName="text-grafite"
        />
        <TextButton
          label={dateLabel}
          accessibilityLabel={`Dia exibido: ${dateLabel}`}
          hint={isToday ? undefined : 'Volta para hoje'}
          onPress={() => showDate(todayIsoDate())}
          className="items-center"
          textVariant="heading"
          textClassName="capitalize text-grafite"
        />
        <TextButton
          label="›"
          accessibilityLabel="Próximo dia"
          onPress={() => showDate(addDaysToIsoDate(currentDate, 1))}
          className="items-center"
          textVariant="subtitle"
          textClassName="text-grafite"
        />
      </View>

      {dayQuery.isPending ? (
        <LoadingIndicator label="Carregando o diário" className="mt-8" />
      ) : dayQuery.isError || !summary ? (
        <View className="px-6">
          <FormError message="Não foi possível carregar o diário." />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerClassName="gap-5 pb-8">
          <MacroSummary
            consumed={summary.summary.consumed}
            target={summary.summary.target}
            remaining={summary.summary.remaining}
          />

          {!hasEntries ? (
            <TextButton
              label={copyDay.isPending ? 'Copiando…' : 'Copiar refeições do dia anterior'}
              onPress={() => void copyPreviousDay()}
              busy={copyDay.isPending}
              className="self-start"
            />
          ) : null}

          {MEAL_TYPE_ORDER.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={summary.meals[mealType]}
              onEntryPress={editEntry}
              onEntryDelete={(entry) => void deleteEntry(entry)}
              onAddPress={() => goToEntry(mealType)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
