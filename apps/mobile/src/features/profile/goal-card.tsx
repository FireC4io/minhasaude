import { View } from 'react-native';

import type { GoalTargetResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';

import { describeGoalTargetPace } from './weekly-pace';

const round = (value: string): number => Math.round(Number(value));

/** Meta atual em linguagem simples, sem siglas soltas (F4-12). Informativa (RDC 657/2022). */
export function GoalCard({ goal }: { goal: GoalTargetResponseDto }) {
  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="label" className="text-grafite-suave">
        Sua meta diária hoje
      </AppText>
      <AppText variant="numberLarge" className="text-grafite">
        {round(goal.targetKcal)} kcal
      </AppText>
      <AppText variant="caption" className="text-grafite">
        Proteínas {round(goal.proteinG)} g · Gorduras {round(goal.fatG)} g · Carboidratos{' '}
        {round(goal.carbG)} g
      </AppText>
      {describeGoalTargetPace(goal) ? (
        <AppText variant="caption" className="text-grafite">
          {describeGoalTargetPace(goal)}
        </AppText>
      ) : null}
      <AppText variant="caption" className="text-grafite-suave">
        Estimativa feita com fórmulas usadas em nutrição a partir dos seus dados. Serve de
        referência e não substitui a orientação de um nutricionista ou médico.
      </AppText>
    </View>
  );
}
