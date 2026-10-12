import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

/**
 * O que a pessoa escolheu para os lembretes. Fica só no aparelho: lembrete é
 * notificação local, sem servidor, e some no logout (`clearReminders`).
 */
export const REMINDER_MEALS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export type ReminderMeal = (typeof REMINDER_MEALS)[number];

/** Tom das frases: o mesmo lembrete dito de três jeitos. */
export const REMINDER_TONES = ['gentle', 'direct', 'playful'] as const;
export type ReminderTone = (typeof REMINDER_TONES)[number];

/** Como o celular avisa. No Android cada um é um canal próprio (o canal não muda depois de criado). */
export const REMINDER_ALERTS = ['sound', 'vibrate', 'silent'] as const;
export type ReminderAlert = (typeof REMINDER_ALERTS)[number];

/** Dias da semana como no calendário ISO: 1 = segunda ... 7 = domingo. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const weekday = z.number().int().min(1).max(7);

const mealReminder = z.object({ enabled: z.boolean(), time });

export const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  meals: z.object({
    breakfast: mealReminder,
    lunch: mealReminder,
    snack: mealReminder,
    dinner: mealReminder,
  }),
  /** Não lembrar da refeição que já foi anotada hoje. */
  skipIfLogged: z.boolean(),
  weight: z.object({ enabled: z.boolean(), weekday, time }),
  evening: z.object({ enabled: z.boolean(), time }),
  /** Dias em que valem os lembretes de refeição e o da noite. */
  weekdays: z.array(weekday).max(7),
  tone: z.enum(REMINDER_TONES),
  alert: z.enum(REMINDER_ALERTS),
  /** Texto genérico ("Você tem um lembrete"), para quem divide o celular. */
  discreet: z.boolean(),
  /** Pausa até esta data (inclusive), no formato do diário (AAAA-MM-DD). */
  pausedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  meals: {
    breakfast: { enabled: true, time: '08:00' },
    lunch: { enabled: true, time: '12:30' },
    snack: { enabled: false, time: '16:00' },
    dinner: { enabled: true, time: '19:30' },
  },
  skipIfLogged: true,
  weight: { enabled: false, weekday: 1, time: '07:30' },
  evening: { enabled: false, time: '21:00' },
  weekdays: [...WEEKDAYS],
  tone: 'gentle',
  alert: 'sound',
  discreet: false,
  pausedUntil: null,
};

const STORAGE_KEY = 'gota-vital:reminders';

/** O que estiver salvo fora do formato vira o padrão: lembrete quebrado não pode travar o app. */
export function parseReminderSettings(raw: unknown): ReminderSettings {
  const parsed = reminderSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_REMINDER_SETTINGS;
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? parseReminderSettings(JSON.parse(stored)) : DEFAULT_REMINDER_SETTINGS;
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Sem armazenamento a escolha vale até fechar o app; os lembretes já agendados continuam.
  }
}

export async function removeReminderSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada a fazer: no próximo login o app começa com o padrão (lembretes desligados).
  }
}

/** Soma `minutes` a um horário "HH:MM", dando a volta no dia. */
export function shiftTime(value: string, minutes: number): string {
  const [h, m] = value.split(':').map(Number);
  const total = ((((h ?? 0) * 60 + (m ?? 0) + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
