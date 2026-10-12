import { t } from 'i18next';

import { MEAL_TYPE_LABELS } from '@/features/diary/meal-type-labels';

import type { ReminderKind } from './reminder-plan';
import type { ReminderMeal, ReminderTone } from './reminder-settings';

/** Frases por tom nas traduções: três para refeição, duas para peso e fim do dia. */
const MEAL_VARIANTS = ['a', 'b', 'c'] as const;
const OTHER_VARIANTS = ['a', 'b'] as const;

interface ReminderLike {
  kind: ReminderKind;
  meal?: ReminderMeal;
  date: string;
}

export interface ReminderMessage {
  title: string;
  body: string;
}

// Mesma frase para o mesmo dia (reagendar não troca o texto), outra no dia seguinte:
// a mesma mensagem todo dia vira ruído e para de ser lida.
function pick<T>(items: readonly T[], seed: string): T {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return items[hash % items.length] as T;
}

export function reminderMessage(reminder: ReminderLike, tone: ReminderTone, discreet: boolean): ReminderMessage {
  if (discreet) return { title: t('reminders.discreet.title'), body: t('reminders.discreet.body') };

  const seed = `${reminder.date}:${reminder.kind}:${reminder.meal ?? ''}`;
  if (reminder.kind === 'meal' && reminder.meal) {
    const label = MEAL_TYPE_LABELS[reminder.meal];
    const variant = pick(MEAL_VARIANTS, seed);
    return {
      title: label,
      body: t(`reminders.messages.${tone}.meal.${variant}`, { meal: label.toLowerCase() }),
    };
  }
  const kind = reminder.kind === 'weight' ? 'weight' : 'evening';
  const variant = pick(OTHER_VARIANTS, seed);
  return { title: t(`reminders.titles.${kind}`), body: t(`reminders.messages.${tone}.${kind}.${variant}`) };
}
