import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { GoalTargetResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';

import { describeGoalTargetPace } from './weekly-pace';

const round = (value: string): number => Math.round(Number(value));

/** Meta atual em linguagem simples, sem siglas soltas (F4-12). Informativa (RDC 657/2022). */
export function GoalCard({ goal }: { goal: GoalTargetResponseDto }) {
  const { t } = useTranslation();
  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="label" className="text-grafite-suave">
        {t('goal.cardTitle')}
      </AppText>
      <AppText variant="numberLarge" className="text-grafite">
        {round(goal.targetKcal)} kcal
      </AppText>
      <AppText variant="caption" className="text-grafite">
        {t('goal.macros', {
          protein: round(goal.proteinG),
          fat: round(goal.fatG),
          carb: round(goal.carbG),
        })}
      </AppText>
      {describeGoalTargetPace(goal) ? (
        <AppText variant="caption" className="text-grafite">
          {describeGoalTargetPace(goal)}
        </AppText>
      ) : null}
      <AppText variant="caption" className="text-grafite-suave">
        {t('goal.disclaimer')}
      </AppText>
    </View>
  );
}
