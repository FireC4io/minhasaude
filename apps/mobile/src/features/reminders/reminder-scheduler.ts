import { t } from 'i18next';
import type * as NotificationTypes from 'expo-notifications';
import { Platform } from 'react-native';

import { todayIsoDate } from '@/features/diary/date-utils';

import { reminderMessage } from './reminder-messages';
import { REMINDER_ID_PREFIX, planReminders, type PlannedReminder, type ReminderKind } from './reminder-plan';
import type { ReminderAlert, ReminderMeal, ReminderSettings } from './reminder-settings';
import { Notifications, REMINDERS_SUPPORTED } from './notifications-module';

export { REMINDERS_SUPPORTED };

// Um canal por jeito de avisar: no Android, som e vibração ficam no canal e não
// mudam depois de criado. Prefixo próprio para nunca mexer em outro canal.
const CHANNEL_IDS: Record<ReminderAlert, string> = {
  sound: 'gv_reminders_sound',
  vibrate: 'gv_reminders_vibrate',
  silent: 'gv_reminders_silent',
};

/** Botões da notificação de refeição. Sem ":" nem "-" no identificador (limite do expo-notifications). */
export const MEAL_CATEGORY = 'gv_meal';
export const ACTION_LOG = 'gv_log';
export const ACTION_SNOOZE = 'gv_snooze';
export const SNOOZE_SECONDS = 30 * 60;

export interface ReminderData {
  kind: ReminderKind | 'test';
  meal?: ReminderMeal;
  date?: string;
}

export type PermissionResult = 'granted' | 'denied' | 'blocked';

async function ensureChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // PRIVATE: com a tela bloqueada protegida, o Android esconde o texto e mostra só "Gota Vital".
  const common = { lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE, showBadge: false };
  await Promise.all([
    Notifications.setNotificationChannelAsync(CHANNEL_IDS.sound, {
      ...common,
      name: t('reminders.channels.sound'),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_IDS.vibrate, {
      ...common,
      name: t('reminders.channels.vibrate'),
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      vibrationPattern: [0, 250, 150, 250],
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_IDS.silent, {
      ...common,
      name: t('reminders.channels.silent'),
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      enableVibrate: false,
    }),
  ]);
}

async function ensureCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(MEAL_CATEGORY, [
    { identifier: ACTION_LOG, buttonTitle: t('reminders.actions.log'), options: { opensAppToForeground: true } },
    { identifier: ACTION_SNOOZE, buttonTitle: t('reminders.actions.snooze'), options: { opensAppToForeground: false } },
  ]);
}

/** Pede a permissão só quando a pessoa liga os lembretes, nunca ao abrir o app. */
export async function requestReminderPermission(): Promise<PermissionResult> {
  if (!REMINDERS_SUPPORTED) return 'denied';
  // No Android 13+ o pedido só aparece depois que existe um canal.
  await ensureChannels();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'blocked';
  const asked = await Notifications.requestPermissionsAsync();
  if (asked.granted) return 'granted';
  return asked.canAskAgain ? 'denied' : 'blocked';
}

function content(
  message: { title: string; body: string },
  data: ReminderData,
  settings: ReminderSettings,
): NotificationTypes.NotificationContentInput {
  return {
    title: message.title,
    body: message.body,
    data: { ...data },
    sound: settings.alert === 'sound',
    categoryIdentifier: data.kind === 'meal' ? MEAL_CATEGORY : undefined,
  };
}

async function cancelOurs(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(REMINDER_ID_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

/**
 * Refaz a agenda do aparelho a partir das escolhas da pessoa: cancela os
 * lembretes do app e agenda de novo os próximos dias. Idempotente.
 *
 * @returns o primeiro lembrete agendado, para a tela mostrar "Próximo lembrete".
 */
export async function syncReminders(
  settings: ReminderSettings,
  loggedToday: ReadonlySet<ReminderMeal>,
  now: Date = new Date(),
): Promise<PlannedReminder | null> {
  if (!REMINDERS_SUPPORTED) return null;
  await cancelOurs();
  const plan = planReminders(settings, now, loggedToday);
  if (plan.length === 0) return null;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return null;
  await ensureChannels();
  await ensureCategory();

  const channelId = CHANNEL_IDS[settings.alert];
  await Promise.all(
    plan.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: content(
          reminderMessage(reminder, settings.tone, settings.discreet),
          { kind: reminder.kind, meal: reminder.meal, date: reminder.date },
          settings,
        ),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at, channelId },
      }),
    ),
  );
  return plan[0] ?? null;
}

/** "Testar lembrete": o almoço de hoje, do jeito escolhido, em 5 segundos. */
export async function sendTestReminder(settings: ReminderSettings): Promise<void> {
  await ensureChannels();
  await ensureCategory();
  const date = todayIsoDate();
  await Notifications.scheduleNotificationAsync({
    content: content(
      reminderMessage({ kind: 'meal', meal: 'lunch', date }, settings.tone, settings.discreet),
      { kind: 'meal', meal: 'lunch', date },
      settings,
    ),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_IDS[settings.alert],
    },
  });
}

/** "Lembrar em 30 min": a mesma notificação, de novo, mais tarde. */
export async function snoozeReminder(request: NotificationTypes.NotificationRequest, settings: ReminderSettings): Promise<void> {
  const { title, body, data } = request.content;
  await Notifications.scheduleNotificationAsync({
    identifier: `${REMINDER_ID_PREFIX}snooze-${Date.now()}`,
    content: content({ title: title ?? '', body: body ?? '' }, data as unknown as ReminderData, settings),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SNOOZE_SECONDS,
      channelId: CHANNEL_IDS[settings.alert],
    },
  });
}

/** Logout e exclusão de conta: nenhum lembrete fica para a próxima pessoa que usar o celular. */
export async function cancelAllReminders(): Promise<void> {
  if (!REMINDERS_SUPPORTED) return;
  try {
    await cancelOurs();
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // Sem permissão ou sem módulo nativo: não há o que cancelar.
  }
}
