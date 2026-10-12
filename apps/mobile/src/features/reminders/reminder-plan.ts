import { addDaysToIsoDate, isoDateFromLocal, localDateFromIso } from '@/features/diary/date-utils';

import type { ReminderMeal, ReminderSettings } from './reminder-settings';
import { REMINDER_MEALS } from './reminder-settings';

export type ReminderKind = 'meal' | 'weight' | 'evening';

export interface PlannedReminder {
  /** Estável por dia: reagendar não duplica. Começa com o prefixo do app. */
  id: string;
  kind: ReminderKind;
  meal?: ReminderMeal;
  /** Dia do diário a que o lembrete se refere (AAAA-MM-DD, horário local). */
  date: string;
  at: Date;
}

export const REMINDER_ID_PREFIX = 'gv-';

/**
 * Quantos dias à frente ficam agendados. Agendar dia a dia (em vez de
 * "repetir todo dia") é o que permite pular só o almoço de hoje quando ele já
 * foi anotado. O app refaz a agenda sempre que abre.
 */
export const PLAN_DAYS = 10;

/** O iPhone guarda no máximo 64 notificações agendadas por app; sobra folga para o "lembrar em 30 min". */
export const MAX_SCHEDULED = 60;

/** Dia da semana ISO (1 = segunda ... 7 = domingo) de uma data AAAA-MM-DD. */
export function isoWeekday(date: string): number {
  const day = localDateFromIso(date).getDay();
  return day === 0 ? 7 : day;
}

function atTime(date: string, time: string): Date {
  const at = localDateFromIso(date);
  const [h, min] = time.split(':').map(Number);
  at.setHours(h ?? 0, min ?? 0, 0, 0);
  return at;
}

/**
 * Lista do que deve tocar, em ordem. Função pura: a agenda do celular é
 * refeita a partir dela (ver `reminder-scheduler.ts`).
 *
 * @param loggedToday refeições já anotadas hoje (para "só se eu ainda não anotei")
 */
export function planReminders(
  settings: ReminderSettings,
  now: Date,
  loggedToday: ReadonlySet<ReminderMeal>,
  days: number = PLAN_DAYS,
): PlannedReminder[] {
  if (!settings.enabled) return [];

  const today = isoDateFromLocal(now);
  const plan: PlannedReminder[] = [];
  const push = (reminder: Omit<PlannedReminder, 'id'> & { key: string }) => {
    if (reminder.at.getTime() <= now.getTime()) return;
    const { key, ...rest } = reminder;
    plan.push({ ...rest, id: `${REMINDER_ID_PREFIX}${key}-${reminder.date}` });
  };

  for (let offset = 0; offset < days; offset++) {
    const date = addDaysToIsoDate(today, offset);
    if (settings.pausedUntil && date <= settings.pausedUntil) continue;
    const weekday = isoWeekday(date);
    const dailyDay = settings.weekdays.includes(weekday);

    if (dailyDay) {
      for (const meal of REMINDER_MEALS) {
        const config = settings.meals[meal];
        if (!config.enabled) continue;
        if (offset === 0 && settings.skipIfLogged && loggedToday.has(meal)) continue;
        push({ key: `meal-${meal}`, kind: 'meal', meal, date, at: atTime(date, config.time) });
      }
      if (settings.evening.enabled) {
        push({ key: 'evening', kind: 'evening', date, at: atTime(date, settings.evening.time) });
      }
    }
    if (settings.weight.enabled && weekday === settings.weight.weekday) {
      push({ key: 'weight', kind: 'weight', date, at: atTime(date, settings.weight.time) });
    }
  }

  return plan.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_SCHEDULED);
}
