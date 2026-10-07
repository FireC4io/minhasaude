import { weightEntrySchema } from '@minhasaude/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useBodyMeasurementsControllerCreate } from '@/api/generated/endpoints/body-measurements/body-measurements';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { parseDecimal } from '@/features/forms/parse-decimal';
import { AppText } from '@/components/ui/app-text';

export default function WeightScreen() {
  const router = useRouter();
  const createMeasurement = useBodyMeasurementsControllerCreate();

  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    const parsed = weightEntrySchema.safeParse({ weightKg: parseDecimal(weightKg) });
    if (!parsed.success) {
      setError('Digite seu peso em quilos, entre 20 e 400 — por exemplo, 70,5.');
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
      router.push('/summary');
    } catch {
      setError('Não foi possível salvar seu peso. Confira sua internet e tente de novo.');
    }
  }

  return (
    <FormScreen>
        <View className="gap-1">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">Seu peso atual</AppText>
          <AppText className="text-grafite">
            Última etapa antes de calcularmos sua meta. Você pode registrar novos pesos depois,
            a qualquer momento.
          </AppText>
        </View>

        <View className="gap-4">
          <AuthTextField
            testID="onboarding-weight-kg"
            label="Peso (kg)"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="ex.: 70,5"
            keyboardType="decimal-pad"
            returnKeyType="go"
            onSubmitEditing={() => void handleSubmit()}
          />
          <FormError message={error} />
          <PrimaryButton label="Continuar" onPress={() => void handleSubmit()} isLoading={createMeasurement.isPending} />
        </View>
    </FormScreen>
  );
}
