import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';
import { displayNumber, spokenGrams, spokenKcal } from '@/features/accessibility/spoken-format';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { parseDecimal } from '@/features/forms/parse-decimal';

import { MicrosPanel } from '@/features/nutrition/micros-panel';
import { rowsForPortion } from '@/features/nutrition/micros-rows';

import { nutrientsFor } from './food-math';

const SHORTCUTS_G = [50, 100, 150, 200] as const;

interface QuantityPickerProps {
  food: Pick<
    FoodResponseDto,
    'kcalPer100g' | 'proteinGPer100g' | 'fatGPer100g' | 'carbGPer100g' | 'micros'
  > | null;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Quantidade em gramas, com atalhos e a conta já feita: a pessoa vê quanto
 * aquilo dá antes de salvar.
 */
export function QuantityPicker({ food, value, onChange, onSubmit }: QuantityPickerProps) {
  const { t } = useTranslation();
  const grams = parseDecimal(value);
  const preview = food ? nutrientsFor(food, grams) : null;

  return (
    <View className="gap-3">
      <AuthTextField
        testID="diary-quantity"
        label={t('diary.quantity')}
        value={value}
        onChangeText={onChange}
        placeholder={t('diary.quantityPlaceholder')}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <View className="flex-row flex-wrap gap-x-4">
        {SHORTCUTS_G.map((shortcut) => (
          <TextButton
            key={shortcut}
            label={`${shortcut} g`}
            accessibilityLabel={t('diary.gramsSpoken', { grams: shortcut })}
            onPress={() => onChange(String(shortcut))}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
          />
        ))}
      </View>
      {preview && preview.kcal > 0 ? (
        <View
          accessible
          accessibilityLabel={t('diary.previewSpoken', {
            kcal: spokenKcal(preview.kcal),
            protein: spokenGrams(preview.proteinG),
            fat: spokenGrams(preview.fatG),
            carbs: spokenGrams(preview.carbG),
          })}
          accessibilityLiveRegion="polite"
          className="gap-1 rounded-2xl bg-superficie p-4">
          <AppText variant="numberLarge" className="text-grafite">
            {preview.kcal} kcal
          </AppText>
          <AppText variant="caption" className="text-grafite">
            {t('goal.macros', {
              protein: displayNumber(preview.proteinG),
              fat: displayNumber(preview.fatG),
              carb: displayNumber(preview.carbG),
            })}
          </AppText>
        </View>
      ) : null}
      {food && preview && preview.kcal > 0 ? (
        <MicrosPanel title={t('diary.otherNutrients')} rows={rowsForPortion(food.micros, grams)} />
      ) : null}
    </View>
  );
}
