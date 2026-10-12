import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { cancelAllReminders, requestReminderPermission, sendTestReminder, syncReminders } from './reminder-scheduler';
import { DEFAULT_REMINDER_SETTINGS } from './reminder-settings';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 6, LOW: 4 },
  AndroidNotificationVisibility: { PRIVATE: 2 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  dismissAllNotificationsAsync: jest.fn(async () => undefined),
}));

const mocked = Notifications as jest.Mocked<typeof Notifications>;
const now = new Date(2026, 9, 12, 10, 0);
const on = { ...DEFAULT_REMINDER_SETTINGS, enabled: true };

describe('reminder-scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('agenda cada lembrete no canal do jeito de avisar escolhido, com id estável', async () => {
    const first = await syncReminders({ ...on, alert: 'vibrate' }, new Set(), now);
    expect(first?.id).toBe('gv-meal-lunch-2026-10-12');
    const call = mocked.scheduleNotificationAsync.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      identifier: 'gv-meal-lunch-2026-10-12',
      content: { title: 'Almoço', sound: false, categoryIdentifier: 'gv_meal', data: { kind: 'meal', meal: 'lunch' } },
      trigger: { type: 'date', channelId: 'gv_reminders_vibrate' },
    });
  });

  it('refaz a agenda: cancela só os lembretes do app, nunca outras notificações', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      { identifier: 'gv-meal-lunch-2026-10-11' },
      { identifier: 'outra-coisa' },
    ] as never);
    await syncReminders(on, new Set(), now);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('gv-meal-lunch-2026-10-11');
  });

  it('sem permissão: não agenda nada', async () => {
    mocked.getPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: true } as never);
    expect(await syncReminders(on, new Set(), now)).toBeNull();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('pede permissão só depois de criar os canais (exigência do Android 13)', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    mocked.getPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: true } as never);
    expect(await requestReminderPermission()).toBe('granted');
    const channelOrder = mocked.setNotificationChannelAsync.mock.invocationCallOrder[0] ?? 0;
    expect(channelOrder).toBeLessThan(mocked.requestPermissionsAsync.mock.invocationCallOrder[0] ?? 0);
  });

  it('negado sem poder perguntar de novo: "blocked", para a tela mandar às configurações', async () => {
    mocked.getPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: false } as never);
    expect(await requestReminderPermission()).toBe('blocked');
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('teste chega em 5 segundos, com a mensagem discreta se for o caso', async () => {
    await sendTestReminder({ ...on, discreet: true });
    expect(mocked.scheduleNotificationAsync.mock.calls[0]?.[0]).toMatchObject({
      content: { title: 'Gota Vital', body: 'Você tem um lembrete.' },
      trigger: { type: 'timeInterval', seconds: 5 },
    });
  });

  it('logout: cancela os lembretes e limpa a bandeja', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValueOnce([{ identifier: 'gv-weight-2026-10-14' }] as never);
    await cancelAllReminders();
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('gv-weight-2026-10-14');
    expect(mocked.dismissAllNotificationsAsync).toHaveBeenCalled();
  });
});
