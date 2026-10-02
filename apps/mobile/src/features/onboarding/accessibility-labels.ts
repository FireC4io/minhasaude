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
    `Taxa metabólica basal estimada: ${spokenKcal(n(goal.bmrKcal))} por dia.`,
    `Gasto energético total estimado: ${spokenKcal(n(goal.tdeeKcal))} por dia.`,
    `Meta diária: ${spokenKcal(n(goal.targetKcal))}.`,
    `Proteína: ${spokenGrams(Math.round(n(goal.proteinG)))}.`,
    `Gordura: ${spokenGrams(Math.round(n(goal.fatG)))}.`,
    `Carboidrato: ${spokenGrams(Math.round(n(goal.carbG)))}.`,
  ].join(' ');
}
