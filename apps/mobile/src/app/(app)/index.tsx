import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCopy,
  useDiaryControllerGetByDate,
  useDiaryControllerRemove,
} from '@/api/generated/endpoints/diary/diary';
import type { DiaryEntryResponseDto, MealType } from '@/api/generated/models';
import { useAuth } from '@/features/auth/auth-context';
import { addDaysToIsoDate, formatIsoDateLabel, todayIsoDate } from '@/features/diary/date-utils';
import { MacroSummary } from '@/features/diary/macro-summary';
import { MealSection } from '@/features/diary/meal-section';
import { MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';

export default function DiaryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(todayIsoDate());

  const dayQuery = useDiaryControllerGetByDate({ date: currentDate });
  const copyDay = useDiaryControllerCopy();
  const removeEntry = useDiaryControllerRemove();

  function invalidateDay() {
    return queryClient.invalidateQueries({
      queryKey: getDiaryControllerGetByDateQueryKey({ date: currentDate }),
    });
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

  const summary = dayQuery.data;
  const hasEntries = summary
    ? MEAL_TYPE_ORDER.some((mealType) => summary.meals[mealType].length > 0)
    : false;

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <View className="flex-row items-center justify-between px-6 pt-2">
        <Text className="text-2xl font-semibold text-grafite">Diário</Text>
        <Pressable onPress={() => void logout()} hitSlop={8}>
          <Text className="text-sm text-grafite">Sair</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between px-6 py-3">
        <Pressable onPress={() => setCurrentDate((date) => addDaysToIsoDate(date, -1))} hitSlop={12}>
          <Text className="text-2xl text-grafite">‹</Text>
        </Pressable>
        <Pressable onPress={() => setCurrentDate(todayIsoDate())}>
          <Text className="text-lg font-semibold capitalize text-grafite">
            {formatIsoDateLabel(currentDate)}
          </Text>
        </Pressable>
        <Pressable onPress={() => setCurrentDate((date) => addDaysToIsoDate(date, 1))} hitSlop={12}>
          <Text className="text-2xl text-grafite">›</Text>
        </Pressable>
      </View>

      {dayQuery.isPending ? (
        <ActivityIndicator className="mt-8" />
      ) : dayQuery.isError || !summary ? (
        <Text className="px-6 text-sm text-jabuticaba">Não foi possível carregar o diário.</Text>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerClassName="gap-5 pb-8">
          <MacroSummary
            consumed={summary.summary.consumed}
            target={summary.summary.target}
            remaining={summary.summary.remaining}
          />

          {!hasEntries ? (
            <Pressable onPress={() => void copyPreviousDay()} disabled={copyDay.isPending}>
              <Text className="text-sm font-semibold text-mamao">
                {copyDay.isPending ? 'Copiando…' : 'Copiar refeições de ontem'}
              </Text>
            </Pressable>
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
