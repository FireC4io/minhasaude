import i18n from 'i18next';
import type { GoalTargetResponseDto } from '@/api/generated/models';
import { spokenGrams, spokenKcal } from '@/features/accessibility/spoken-format';

type GoalNumbers = Pick<
  GoalTargetResponseDto,
  'bmrKcal' | 'tdeeKcal' | 'targetKcal' | 'proteinG' | 'fatG' | 'carbG'
>;

/**
 * O card de meta lido por extenso. O texto visual usa "kcal/dia" e "120g",
 * que o leitor de tela fala como "kcal barra dia" e soletra o "g".
 */
export function describeGoal(goal: GoalNumbers): string {
  // Colunas `numeric` chegam como string pelo TypeORM.
  const n = (value: string) => Number(value);
  return [
    i18n.t('goal.spokenResting', { kcal: spokenKcal(n(goal.bmrKcal)) }),
    i18n.t('goal.spokenTotal', { kcal: spokenKcal(n(goal.tdeeKcal)) }),
    i18n.t('goal.spokenDaily', { kcal: spokenKcal(n(goal.targetKcal)) }),
    i18n.t('goal.spokenMacros', {
      protein: spokenGrams(Math.round(n(goal.proteinG))),
      fat: spokenGrams(Math.round(n(goal.fatG))),
      carb: spokenGrams(Math.round(n(goal.carbG))),
    }),
  ].join(' ');
}
