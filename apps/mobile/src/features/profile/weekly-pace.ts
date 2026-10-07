import { DEFAULT_WEEKLY_PACE_KG, WEEKLY_PACES_KG, type Goal } from '@minhasaude/shared';
import i18n from 'i18next';

import type { GoalTargetResponseDto } from '@/api/generated/models';
import type { RadioOption } from '@/components/ui/radio-list';
import { displayNumber } from '@/features/accessibility/spoken-format';
import { translatedLabels } from '@/i18n/labels';

/**
 * Ritmo semanal no onboarding e na edição do perfil. O `RadioList` trabalha
 * com texto, então a opção é a string do número ('0.25') e vira número só na
 * hora de mandar para a API.
 *
 * Texto informativo, sem promessa (RDC 657/2022): o ritmo é uma estimativa
 * usada para calcular a meta, não um resultado garantido.
 */
export type PaceOption = `${(typeof WEEKLY_PACES_KG)[number]}`;

export const DEFAULT_PACE_OPTION = String(DEFAULT_WEEKLY_PACE_KG) as PaceOption;

const DESCRIPTIONS: Record<PaceOption, string> = translatedLabels({
  '0.25': 'weeklyPace.light',
  '0.5': 'weeklyPace.medium',
  '0.75': 'weeklyPace.strong',
});

export function paceOptionsFor(goal: Goal): readonly RadioOption<PaceOption>[] {
  if (goal === 'maintain') return [];
  return WEEKLY_PACES_KG.map((pace) => {
    const value = String(pace) as PaceOption;
    return {
      value,
      label: i18n.t(goal === 'lose' ? 'weeklyPace.lose' : 'weeklyPace.gain', { amount: displayNumber(pace, 2) }),
      description: DESCRIPTIONS[value],
    };
  });
}

export function paceOptionToKg(option: PaceOption): number {
  return Number(option);
}

/** A API devolve numeric como string ('0.50'); valor fora das opções vira null. */
export function paceKgToOption(value: string | number | null | undefined): PaceOption | null {
  if (value === null || value === undefined) return null;
  const pace = Number(value);
  return (WEEKLY_PACES_KG as readonly number[]).includes(pace) ? (String(pace) as PaceOption) : null;
}

/** Frase do resumo da meta; null quando não há ritmo (manter). */
export function describeWeeklyPace(
  goal: Goal,
  weeklyPaceKg: string | null,
  limitedByBmr: boolean,
): string | null {
  const option = paceKgToOption(weeklyPaceKg);
  if (goal === 'maintain' || !option) return null;
  const amount = displayNumber(Number(option), 2);
  const base = i18n.t(goal === 'lose' ? 'weeklyPace.chosenLose' : 'weeklyPace.chosenGain', { amount });
  return limitedByBmr ? `${base} ${i18n.t('weeklyPace.limited')}` : base;
}

type GoalTargetPace = Pick<
  GoalTargetResponseDto,
  'weeklyPaceKg' | 'limitedByBmr' | 'isManualOverride' | 'targetKcal' | 'tdeeKcal'
>;

/**
 * Frase do ritmo a partir da meta salva. A meta não guarda o objetivo, mas o
 * ritmo só existe para perder ou ganhar: meta acima do gasto total é ganhar.
 * Meta ajustada à mão não segue o ritmo, então não mostra a frase.
 */
export function describeGoalTargetPace(goal: GoalTargetPace): string | null {
  if (goal.isManualOverride || !goal.weeklyPaceKg) return null;
  const direction: Goal = Number(goal.targetKcal) > Number(goal.tdeeKcal) ? 'gain' : 'lose';
  return describeWeeklyPace(direction, goal.weeklyPaceKg, goal.limitedByBmr);
}
