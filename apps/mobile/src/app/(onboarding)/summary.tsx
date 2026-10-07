import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getGoalsControllerGetCurrentQueryKey,
  useGoalsControllerRecalculate,
} from '@/api/generated/endpoints/goals/goals';
import { useTranslation } from 'react-i18next';
import type { GoalTargetResponseDto } from '@/api/generated/models';
import { FormError } from '@/components/ui/form-error';
import { PrimaryButton } from '@/features/auth/primary-button';
import { describeGoal } from '@/features/onboarding/accessibility-labels';
import { spokenKcal } from '@/features/accessibility/spoken-format';
import { describeGoalTargetPace } from '@/features/profile/weekly-pace';
import { AppText } from '@/components/ui/app-text';

export default function SummaryScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const recalculate = useGoalsControllerRecalculate();
  const [result, setResult] = useState<GoalTargetResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    setError(null);
    try {
      const goal = await recalculate.mutateAsync({ data: {} });
      setResult(goal);
      // O botão "Calcular" some quando o resultado aparece, e o foco do leitor
      // de tela fica sem destino. O anúncio diz o que mudou na tela.
      AccessibilityInfo.announceForAccessibility(
        t('goal.calculatedAnnounce', { kcal: spokenKcal(Number(goal.targetKcal)) }),
      );
    } catch {
      setError(t('goal.calculateError'));
    }
  }

  // Só atualiza o cache (e deixa o guard da rota raiz trocar pro app
  // principal) depois que o usuário já viu o resultado e confirmou —
  // se atualizássemos assim que a meta calcula, o Stack.Protected troca de
  // grupo antes da tela de resumo chegar a renderizar o resultado.
  function handleContinue() {
    if (result) {
      queryClient.setQueryData(getGoalsControllerGetCurrentQueryKey(), result);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="gap-1">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">{t('goal.title')}</AppText>
          <AppText className="text-grafite">
            {t('goal.intro')}
          </AppText>
        </View>

        {result ? (
          <View className="gap-4">
            <View
              accessible
              accessibilityLabel={[describeGoal(result), describeGoalTargetPace(result)]
                .filter(Boolean)
                .join(' ')}
              className="gap-2 rounded-2xl border border-grafite bg-superficie p-4">
              <AppText className="text-grafite">
                {t('goal.resting', { kcal: Math.round(Number(result.bmrKcal)) })}
              </AppText>
              <AppText className="text-grafite">
                {t('goal.total', { kcal: Math.round(Number(result.tdeeKcal)) })}
              </AppText>
              <AppText variant="heading" className="text-grafite">
                {t('goal.daily', { kcal: Math.round(Number(result.targetKcal)) })}
              </AppText>
              <AppText className="text-grafite">
                {t('goal.macros', {
                  protein: Math.round(Number(result.proteinG)),
                  fat: Math.round(Number(result.fatG)),
                  carb: Math.round(Number(result.carbG)),
                })}
              </AppText>
              {describeGoalTargetPace(result) ? (
                <AppText className="text-grafite">{describeGoalTargetPace(result)}</AppText>
              ) : null}
            </View>
            <AppText variant="caption" className="italic text-grafite">
              {t('goal.disclaimer')}
            </AppText>
            <PrimaryButton label={t('profileForm.next')} onPress={handleContinue} />
          </View>
        ) : (
          <>
            <FormError message={error} />
            <PrimaryButton
              label={t('profileForm.calculate')}
              onPress={handleCalculate}
              isLoading={recalculate.isPending}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
