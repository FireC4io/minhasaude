import { weightEntrySchema } from '@minhasaude/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getBodyMeasurementsControllerListQueryKey,
  useBodyMeasurementsControllerCreate,
  useBodyMeasurementsControllerList,
} from '@/api/generated/endpoints/body-measurements/body-measurements';
import { FormError } from '@/components/ui/form-error';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { WeightChart } from '@/features/weight/weight-chart';
import { WeightHistoryList } from '@/features/weight/weight-history-list';
import { parseDecimal } from '@/features/forms/parse-decimal';
import { AppText } from '@/components/ui/app-text';

// Só medidas registradas na mão: o app nunca mistura fontes no mesmo gráfico,
// porque bioimpedância de aparelhos diferentes não é comparável (CLAUDE.md).
const LIST_PARAMS = { source: 'manual' } as const;

export default function WeightScreen() {
  const queryClient = useQueryClient();
  const historyQuery = useBodyMeasurementsControllerList(LIST_PARAMS);
  const createMeasurement = useBodyMeasurementsControllerCreate();

  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    const parsed = weightEntrySchema.safeParse({ weightKg: parseDecimal(weightKg) });
    if (!parsed.success) {
      setError('Informe um peso válido (entre 20 e 400 kg).');
      return;
    }

    try {
      await createMeasurement.mutateAsync({
        data: {
          measuredAt: new Date().toISOString(),
          source: 'manual',
          weightKg: parsed.data.weightKg,
        },
      });
      setWeightKg('');
      await queryClient.invalidateQueries({
        queryKey: getBodyMeasurementsControllerListQueryKey(LIST_PARAMS),
      });
    } catch {
      setError('Não foi possível salvar seu peso. Tente de novo.');
    }
  }

  const measurements = historyQuery.data?.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-6 py-8">
          <View className="gap-1">
            <AppText variant="title" accessibilityRole="header" className="text-grafite">Peso</AppText>
            <AppText className="text-grafite">
              Registre seu peso quando quiser e acompanhe a evolução ao longo do tempo.
            </AppText>
          </View>

          <View className="gap-4">
            <AuthTextField
              testID="weight-kg"
              label="Peso (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="70.5"
              keyboardType="decimal-pad"
            />
            <FormError message={error} />
            <PrimaryButton
              label="Registrar peso"
              onPress={handleSubmit}
              isLoading={createMeasurement.isPending}
            />
          </View>

          {historyQuery.isError ? (
            <AppText variant="caption" className="text-jabuticaba">
              Não foi possível carregar seu histórico agora.
            </AppText>
          ) : (
            <>
              <WeightChart measurements={measurements} />
              <WeightHistoryList measurements={measurements} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
