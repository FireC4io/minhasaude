import { weightEntrySchema } from '@minhasaude/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import {
  getBodyMeasurementsControllerListQueryKey,
  useBodyMeasurementsControllerCreate,
} from '@/api/generated/endpoints/body-measurements/body-measurements';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { parseDecimal } from '@/features/forms/parse-decimal';

import { formatKg } from './format-weight';

interface WeightEntryFormProps {
  onSaved?: () => void;
}

/** Registro de peso manual — usado no Progresso e no "+" da tela Hoje. */
export function WeightEntryForm({ onSaved }: WeightEntryFormProps) {
  const queryClient = useQueryClient();
  const createMeasurement = useBodyMeasurementsControllerCreate();
  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  useAnnounce(saved);

  async function handleSubmit() {
    setError(null);
    setSaved(null);

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
      setWeightKg('');
      setSaved(`Peso de ${formatKg(parsed.data.weightKg)} registrado.`);
      // Sem parâmetros a chave é o prefixo de todas as listas (Progresso, card de último peso).
      await queryClient.invalidateQueries({ queryKey: getBodyMeasurementsControllerListQueryKey() });
      onSaved?.();
    } catch {
      setError('Não foi possível salvar seu peso. Confira sua internet e tente de novo.');
    }
  }

  return (
    <View className="gap-4">
      <AuthTextField
        testID="weight-kg"
        label="Peso (kg)"
        value={weightKg}
        onChangeText={setWeightKg}
        placeholder="ex.: 70,5"
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={() => void handleSubmit()}
      />
      <FormError message={error} />
      {saved ? (
        <AppText variant="bodyStrong" className="text-grafite">
          ✓ {saved}
        </AppText>
      ) : null}
      <PrimaryButton
        label="Registrar peso"
        onPress={() => void handleSubmit()}
        isLoading={createMeasurement.isPending}
      />
    </View>
  );
}
