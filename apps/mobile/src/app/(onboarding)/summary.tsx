import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getGoalsControllerGetCurrentQueryKey,
  useGoalsControllerRecalculate,
} from '@/api/generated/endpoints/goals/goals';
import type { GoalTargetResponseDto } from '@/api/generated/models';
import { PrimaryButton } from '@/features/auth/primary-button';

export default function SummaryScreen() {
  const queryClient = useQueryClient();
  const recalculate = useGoalsControllerRecalculate();
  const [result, setResult] = useState<GoalTargetResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    setError(null);
    try {
      const goal = await recalculate.mutateAsync({ data: {} });
      setResult(goal);
    } catch {
      setError('Não foi possível calcular sua meta agora. Tente de novo.');
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
          <Text className="text-3xl font-semibold text-grafite">Sua meta</Text>
          <Text className="text-base text-grafite">
            Calculamos a partir do seu perfil e do peso registrado.
          </Text>
        </View>

        {result ? (
          <View className="gap-4">
            <View className="gap-2 rounded-2xl border border-grafite bg-white p-4">
              <Text className="text-base text-grafite">
                Taxa metabólica basal estimada: {Math.round(Number(result.bmrKcal))} kcal/dia
              </Text>
              <Text className="text-base text-grafite">
                Gasto energético total estimado: {Math.round(Number(result.tdeeKcal))} kcal/dia
              </Text>
              <Text className="text-lg font-semibold text-grafite">
                Meta diária: {Math.round(Number(result.targetKcal))} kcal
              </Text>
              <Text className="text-base text-grafite">
                Proteína: {Math.round(Number(result.proteinG))}g · Gordura:{' '}
                {Math.round(Number(result.fatG))}g · Carboidrato: {Math.round(Number(result.carbG))}g
              </Text>
            </View>
            <Text className="text-sm italic text-grafite">
              Informativo, baseado em fórmulas padrão da literatura — não substitui orientação de
              um nutricionista ou médico.
            </Text>
            <PrimaryButton label="Continuar" onPress={handleContinue} />
          </View>
        ) : (
          <>
            {error ? <Text className="text-sm text-jabuticaba">{error}</Text> : null}
            <PrimaryButton
              label="Calcular minha meta"
              onPress={handleCalculate}
              isLoading={recalculate.isPending}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
