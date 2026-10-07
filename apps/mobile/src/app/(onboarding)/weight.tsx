import { weightEntrySchema } from '@minhasaude/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useBodyMeasurementsControllerCreate } from '@/api/generated/endpoints/body-measurements/body-measurements';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { parseDecimal } from '@/features/forms/parse-decimal';
import { AppText } from '@/components/ui/app-text';

export default function WeightScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createMeasurement = useBodyMeasurementsControllerCreate();

  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    const parsed = weightEntrySchema.safeParse({ weightKg: parseDecimal(weightKg) });
    if (!parsed.success) {
      setError(t('onboarding.weightInvalid'));
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
      setError(t('onboarding.weightError'));
    }
  }

  return (
    <FormScreen>
        <View className="gap-1">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">{t('onboarding.weightTitle')}</AppText>
          <AppText className="text-grafite">
            {t('onboarding.weightIntro')}
          </AppText>
        </View>

        <View className="gap-4">
          <AuthTextField
            testID="onboarding-weight-kg"
            label={t('onboarding.weightLabel')}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder={t('onboarding.weightPlaceholder')}
            keyboardType="decimal-pad"
            returnKeyType="go"
            onSubmitEditing={() => void handleSubmit()}
          />
          <FormError message={error} />
          <PrimaryButton label={t('profileForm.next')} onPress={() => void handleSubmit()} isLoading={createMeasurement.isPending} />
        </View>
    </FormScreen>
  );
}
