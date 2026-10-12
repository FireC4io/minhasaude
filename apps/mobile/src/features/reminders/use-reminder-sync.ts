import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useDiaryControllerGetByDate } from '@/api/generated/endpoints/diary/diary';
import { todayIsoDate } from '@/features/diary/date-utils';

import { REMINDER_MEALS, type ReminderMeal } from './reminder-settings';
import {
  ACTION_SNOOZE,
  REMINDERS_SUPPORTED,
  snoozeReminder,
  syncReminders,
  type ReminderData,
} from './reminder-scheduler';
import { getReminderSettings, initReminderStore, useReminderSettings } from './reminder-store';

// Com o app aberto, a notificação aparece mesmo assim (é o horário que a pessoa escolheu).
if (REMINDERS_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: getReminderSettings().alert === 'sound',
      shouldSetBadge: false,
    }),
  });
}

/**
 * Mantém a agenda de lembretes em dia: ao abrir o app, ao voltar para ele, ao
 * mudar as escolhas e ao anotar uma refeição (o lembrete dela some hoje).
 * Também trata o toque na notificação. Usado uma vez, na área logada.
 */
export function useReminderSync(): void {
  const router = useRouter();
  const settings = useReminderSettings();
  const [today, setToday] = useState(() => todayIsoDate());
  const day = useDiaryControllerGetByDate({ date: today }, { query: { enabled: REMINDERS_SUPPORTED && settings.enabled } });

  const loggedKey = REMINDER_MEALS.filter((meal) => (day.data?.meals[meal]?.length ?? 0) > 0).join(',');
  const loggedToday = useMemo(() => new Set(loggedKey.split(',').filter(Boolean) as ReminderMeal[]), [loggedKey]);

  useEffect(() => {
    void initReminderStore();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(todayIsoDate());
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!REMINDERS_SUPPORTED) return;
    // Erro aqui não pode derrubar a tela: a agenda é refeita na próxima abertura.
    syncReminders(settings, loggedToday).catch(() => undefined);
  }, [settings, loggedToday, today]);

  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse) return;
    const data = lastResponse.notification.request.content.data as unknown as ReminderData | undefined;
    void Notifications.clearLastNotificationResponseAsync();
    if (lastResponse.actionIdentifier === ACTION_SNOOZE) {
      void snoozeReminder(lastResponse.notification.request, getReminderSettings());
      return;
    }
    if (data?.kind === 'meal' && data.meal) {
      router.push({ pathname: '/diary-entry', params: { date: data.date ?? todayIsoDate(), mealType: data.meal } });
    } else if (data?.kind === 'weight') {
      router.push('/weight-entry');
    }
    // "Fim do dia" e o teste só abrem o app, na tela Hoje.
  }, [lastResponse, router]);
}
