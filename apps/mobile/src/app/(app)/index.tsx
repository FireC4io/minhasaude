import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCopy,
  useDiaryControllerCreate,
  useDiaryControllerGetByDate,
  useDiaryControllerRemove,
} from '@/api/generated/endpoints/diary/diary';
import type { DiaryEntryResponseDto, MealType } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { FloatingAddButton } from '@/components/ui/floating-add-button';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';
import { UndoBar } from '@/components/ui/undo-bar';
import { PREVIEW_FEATURES } from '@/config/features';
import { addDaysToIsoDate, formatIsoDateLabel, todayIsoDate } from '@/features/diary/date-utils';
import { MealSection } from '@/features/diary/meal-section';
import { MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';
import { CalendarModal } from '@/features/today/calendar-modal';
import { CaloriesCard } from '@/features/today/calories-card';
import { MacrosCard } from '@/features/today/macros-card';
import { NotesCard } from '@/features/today/notes-card';
import { dayHasEntries, useWeekEntries } from '@/features/today/use-week-entries';
import { WeekStrip } from '@/features/today/week-strip';
import { WaterCard } from '@/features/water/water-card';
import { LastWeightCard } from '@/features/weight/last-weight-card';

/** Tela Hoje (F4-30): data, semana, calorias, nutrientes, refeições, água, peso e notas. */
export default function TodayScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(todayIsoDate());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [removed, setRemoved] = useState<DiaryEntryResponseDto | null>(null);

  const dayQuery = useDiaryControllerGetByDate({ date: currentDate });
  const previousDayQuery = useDiaryControllerGetByDate({
    date: addDaysToIsoDate(currentDate, -1),
  });
  const daysWithEntries = useWeekEntries(currentDate);
  const copyDay = useDiaryControllerCopy();
  const removeEntry = useDiaryControllerRemove();
  const createEntry = useDiaryControllerCreate();

  const invalidateDay = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: getDiaryControllerGetByDateQueryKey({ date: currentDate }),
      }),
    [queryClient, currentDate],
  );

  // Quem troca de dia continua com o foco no controle: sem o anúncio, o
  // leitor não diz para qual dia foi. Aqui não há liveRegion, então não duplica.
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
      params: { id: entry.id, date: currentDate, foodName: entry.food.name, quantity: entry.quantity },
    });
  }

  async function deleteEntry(entry: DiaryEntryResponseDto) {
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
    await copyDay.mutateAsync({
      data: { fromDate: addDaysToIsoDate(currentDate, -1), toDate: currentDate },
    });
    await invalidateDay();
  }

  const dismissUndo = useCallback(() => setRemoved(null), []);

  const dateLabel = formatIsoDateLabel(currentDate);
  const isToday = currentDate === todayIsoDate();
  const summary = dayQuery.data;
  const hasEntries = dayHasEntries(summary);
  // Achado #10: o atalho aparecia até para conta criada hoje, sem dia anterior.
  const canCopyPrevious = !hasEntries && dayHasEntries(previousDayQuery.data);

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-5 px-6 pb-28 pt-2">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <TextButton
            label={`${dateLabel} ▾`}
            accessibilityLabel={`Dia exibido: ${dateLabel}`}
            hint="Abre o calendário para escolher outro dia"
            onPress={() => setCalendarOpen(true)}
            textVariant="title"
            textClassName="capitalize text-grafite"
          />
          {!isToday ? (
            <TextButton
              label="Voltar para hoje"
              onPress={() => showDate(todayIsoDate())}
              textVariant="bodyStrong"
              textClassName="text-mamao-forte"
            />
          ) : null}
        </View>

        <WeekStrip
          selectedDate={currentDate}
          daysWithEntries={daysWithEntries}
          onSelect={showDate}
        />

        {dayQuery.isPending ? (
          <LoadingIndicator label="Carregando o dia" className="mt-8" />
        ) : dayQuery.isError || !summary ? (
          <View className="gap-2">
            <FormError message="Não foi possível carregar este dia. Confira sua internet." />
            <TextButton
              label="Tentar de novo"
              onPress={() => void dayQuery.refetch()}
              textVariant="bodyStrong"
              textClassName="text-mamao-forte"
              className="self-start"
            />
          </View>
        ) : (
          <>
            <CaloriesCard
              consumedKcal={summary.summary.consumed.kcal}
              targetKcal={summary.summary.target?.kcal ?? null}
            />
            <MacrosCard consumed={summary.summary.consumed} target={summary.summary.target} />

            <View className="gap-4">
              <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
                Refeições
              </AppText>
              {!hasEntries ? (
                <AppText className="text-grafite-suave">
                  Nada registrado neste dia ainda. Toque em “+ Adicionar alimento” na refeição, ou no
                  botão + no canto da tela.
                </AppText>
              ) : null}
              {canCopyPrevious ? (
                <TextButton
                  label={copyDay.isPending ? 'Copiando…' : 'Copiar as refeições do dia anterior'}
                  onPress={() => void copyPreviousDay()}
                  busy={copyDay.isPending}
                  textVariant="bodyStrong"
                  textClassName="text-mamao-forte"
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
            </View>
          </>
        )}

        {PREVIEW_FEATURES ? (
          <WaterCard
            date={currentDate}
            onOpenDetails={() => router.push({ pathname: '/water', params: { date: currentDate } })}
          />
        ) : null}
        <LastWeightCard onRegister={() => router.push('/weight-entry')} />
        {PREVIEW_FEATURES ? <NotesCard date={currentDate} /> : null}
      </ScrollView>

      {removed ? (
        <UndoBar
          message={`${removed.food.name} removido`}
          onUndo={() => void undoRemove()}
          onDismiss={dismissUndo}
        />
      ) : null}

      <FloatingAddButton
        onPress={() => router.push({ pathname: '/quick-add', params: { date: currentDate } })}
      />

      <CalendarModal
        key={`${calendarOpen}-${currentDate}`}
        visible={calendarOpen}
        selectedDate={currentDate}
        onSelect={showDate}
        onClose={() => setCalendarOpen(false)}
      />
    </SafeAreaView>
  );
}
