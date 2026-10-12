import { PORTION_LIMITS, customPortionSchema } from '@minhasaude/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  getPortionsControllerListQueryKey,
  usePortionsControllerCreate,
} from '@/api/generated/endpoints/foods/foods';
import type { PortionResponseDto } from '@/api/generated/models';
import { FormError } from '@/components/ui/form-error';
import { TextButton } from '@/components/ui/text-button';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { parseDecimal } from '@/features/forms/parse-decimal';

interface CustomMeasureFormProps {
  foodId: string;
  onCreated: (portion: PortionResponseDto) => void;
  onCancel: () => void;
}

/** "Minha caneca = 180 g": a medida de casa que não está na lista. */
export function CustomMeasureForm({ foodId, onCreated, onCancel }: Readonly<CustomMeasureFormProps>) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const createPortion = usePortionsControllerCreate();
  const [label, setLabel] = useState('');
  const [grams, setGrams] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const parsed = customPortionSchema.safeParse({ label, grams: parseDecimal(grams) });
    if (!parsed.success) {
      setError(t('portions.customInvalid'));
      return;
    }
    try {
      const created = await createPortion.mutateAsync({ id: foodId, data: parsed.data });
      await queryClient.invalidateQueries({ queryKey: getPortionsControllerListQueryKey(foodId) });
      AccessibilityInfo.announceForAccessibility(t('portions.customSaved', { name: parsed.data.label }));
      onCreated(created);
    } catch {
      setError(t('portions.customError'));
    }
  }

  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AuthTextField
        testID="custom-measure-name"
        label={t('portions.customName')}
        value={label}
        onChangeText={setLabel}
        maxLength={PORTION_LIMITS.labelMax}
        placeholder={t('portions.customNamePlaceholder')}
        returnKeyType="next"
      />
      <AuthTextField
        testID="custom-measure-grams"
        label={t('portions.customGrams')}
        value={grams}
        onChangeText={setGrams}
        placeholder={t('portions.customGramsPlaceholder')}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={() => void handleSave()}
      />
      <FormError message={error} />
      <PrimaryButton
        label={t('portions.customSave')}
        onPress={() => void handleSave()}
        isLoading={createPortion.isPending}
      />
      <TextButton
        label={t('portions.customCancel')}
        onPress={onCancel}
        className="items-center"
        textClassName="text-mamao-forte"
      />
    </View>
  );
}
