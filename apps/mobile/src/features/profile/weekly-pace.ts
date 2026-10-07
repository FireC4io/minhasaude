import { DEFAULT_WEEKLY_PACE_KG, WEEKLY_PACES_KG, type Goal } from '@minhasaude/shared';

import type { GoalTargetResponseDto } from '@/api/generated/models';
import type { RadioOption } from '@/components/ui/radio-list';
import { displayNumber } from '@/features/accessibility/spoken-format';

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

const DESCRIPTIONS: Record<PaceOption, string> = {
  '0.25': 'Mais leve: mudança pequena na alimentação do dia a dia.',
  '0.5': 'Intermediário.',
  '0.75': 'Mais puxado: pede uma mudança maior na alimentação.',
};

const VERB: Record<Exclude<Goal, 'maintain'>, string> = { lose: 'Perder', gain: 'Ganhar' };

const kgPerWeek = (pace: number): string => `${displayNumber(pace, 2)} kg por semana`;

export function paceOptionsFor(goal: Goal): readonly RadioOption<PaceOption>[] {
  if (goal === 'maintain') return [];
  return WEEKLY_PACES_KG.map((pace) => {
    const value = String(pace) as PaceOption;
    return { value, label: `${VERB[goal]} ${kgPerWeek(pace)}`, description: DESCRIPTIONS[value] };
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
  const base = `Ritmo escolhido: ${VERB[goal].toLowerCase()} ${kgPerWeek(Number(option))}.`;
  return limitedByBmr
    ? `${base} Para a meta não ficar abaixo do que o seu corpo gasta em repouso, ela foi ajustada para cima.`
    : base;
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
