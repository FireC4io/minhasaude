import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useDiaryControllerGetByDate } from '@/api/generated/endpoints/diary/diary';
import type { DiaryEntryResponseDto } from '@/api/generated/models';
import { FloatingAddButton } from '@/components/ui/floating-add-button';
import { UndoBar } from '@/components/ui/undo-bar';
import { PREVIEW_FEATURES } from '@/config/features';
import { addDaysToIsoDate, formatIsoDateLabel, todayIsoDate } from '@/features/diary/date-utils';
import { QueryStateView } from '@/features/network/query-state-view';
import { queryView } from '@/features/network/query-view';
import { MicrosPanel } from '@/features/nutrition/micros-panel';
import { rowsForDay } from '@/features/nutrition/micros-rows';
import { pendingClientId } from '@/features/offline-queue/merge-pending';
import { useDayWithPending } from '@/features/offline-queue/offline-queue';
import { PendingCard } from '@/features/offline-queue/pending-card';
import { CalendarModal } from '@/features/today/calendar-modal';
import { CaloriesCard } from '@/features/today/calories-card';
import { DayHeader } from '@/features/today/day-header';
import { MacrosCard } from '@/features/today/macros-card';
import { MealsList } from '@/features/today/meals-list';
import { NotesCard } from '@/features/today/notes-card';
import { useDayEntryActions } from '@/features/today/use-day-entry-actions';
import { dayHasEntries, useWeekEntries } from '@/features/today/use-week-entries';
import { WeekStrip } from '@/features/today/week-strip';
import { WaterCard } from '@/features/water/water-card';
import { LastWeightCard } from '@/features/weight/last-weight-card';

/** Tela Hoje (F4-30): data, semana, calorias, nutrientes, refeições, água, peso e notas. */
export default function TodayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(todayIsoDate());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // O dia do servidor mais o que foi anotado sem internet e ainda vai ser enviado.
  const { query: dayQuery, data: summary } = useDayWithPending(currentDate);
  const previousDayQuery = useDiaryControllerGetByDate({ date: addDaysToIsoDate(currentDate, -1) });
  const daysWithEntries = useWeekEntries(currentDate);
  const actions = useDayEntryActions(currentDate);

  // Quem troca de dia continua com o foco no controle: sem o anúncio, o
  // leitor não diz para qual dia foi. Aqui não há liveRegion, então não duplica.
  function showDate(date: string) {
    setCurrentDate(date);
    AccessibilityInfo.announceForAccessibility(formatIsoDateLabel(date));
  }

  function editEntry(entry: DiaryEntryResponseDto) {
    // A anotação guardada sem internet ainda não existe no servidor para ser editada.
    if (pendingClientId(entry)) return;
    router.push({
      pathname: '/diary-entry',
      params: { id: entry.id, date: currentDate, foodName: entry.food.name, quantity: entry.quantity },
    });
  }

  const hasEntries = dayHasEntries(summary);
  const view = queryView({ isPending: dayQuery.isPending, data: summary });

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-5 px-6 pb-28 pt-2">
        <DayHeader
          date={currentDate}
          onOpenCalendar={() => setCalendarOpen(true)}
          onBackToToday={() => showDate(todayIsoDate())}
        />
        <WeekStrip selectedDate={currentDate} daysWithEntries={daysWithEntries} onSelect={showDate} />

        <PendingCard />

        <QueryStateView
          view={view}
          loadingLabel={t('today.loadingDay')}
          loadingClassName="mt-8"
          errorMessage={t('today.loadDayError')}
          onRetry={() => void dayQuery.refetch()}>
          {() =>
            summary && (
              <>
                <CaloriesCard
                  consumedKcal={summary.summary.consumed.kcal}
                  targetKcal={summary.summary.target?.kcal ?? null}
                />
                <MacrosCard consumed={summary.summary.consumed} target={summary.summary.target} />
                {hasEntries ? (
                  <MicrosPanel title={t('today.otherNutrients')} rows={rowsForDay(summary.summary.micros)} />
                ) : null}
                <MealsList
                  day={summary}
                  // Achado #10: o atalho aparecia até para conta criada hoje, sem dia anterior.
                  canCopyPrevious={!hasEntries && dayHasEntries(previousDayQuery.data)}
                  isCopying={actions.isCopying}
                  onCopyPrevious={() => void actions.copyPreviousDay()}
                  onAdd={(mealType) => router.push({ pathname: '/diary-entry', params: { date: currentDate, mealType } })}
                  onEdit={editEntry}
                  onRemove={(entry) => void actions.remove(entry)}
                />
              </>
            )
          }
        </QueryStateView>

        {PREVIEW_FEATURES ? (
          <WaterCard
            date={currentDate}
            onOpenDetails={() => router.push({ pathname: '/water', params: { date: currentDate } })}
          />
        ) : null}
        <LastWeightCard onRegister={() => router.push('/weight-entry')} />
        {PREVIEW_FEATURES ? <NotesCard date={currentDate} /> : null}
      </ScrollView>

      {actions.removed ? (
        <UndoBar
          message={t('today.removed', { name: actions.removed.food.name })}
          onUndo={() => void actions.undoRemove()}
          onDismiss={actions.dismissUndo}
        />
      ) : null}

      <FloatingAddButton onPress={() => router.push({ pathname: '/quick-add', params: { date: currentDate } })} />

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
