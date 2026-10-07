import { View } from 'react-native';

import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';
import { displayNumber, spokenGrams, spokenKcal } from '@/features/accessibility/spoken-format';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { parseDecimal } from '@/features/forms/parse-decimal';

import { nutrientsFor } from './food-math';

const SHORTCUTS_G = [50, 100, 150, 200] as const;

interface QuantityPickerProps {
  food: Pick<FoodResponseDto, 'kcalPer100g' | 'proteinGPer100g' | 'fatGPer100g' | 'carbGPer100g'> | null;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Quantidade em gramas, com atalhos e a conta já feita: a pessoa vê quanto
 * aquilo dá antes de salvar.
 */
export function QuantityPicker({ food, value, onChange, onSubmit }: QuantityPickerProps) {
  const grams = parseDecimal(value);
  const preview = food ? nutrientsFor(food, grams) : null;

  return (
    <View className="gap-3">
      <AuthTextField
        testID="diary-quantity"
        label="Quantidade (g)"
        value={value}
        onChangeText={onChange}
        placeholder="ex.: 100"
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <View className="flex-row flex-wrap gap-x-4">
        {SHORTCUTS_G.map((shortcut) => (
          <TextButton
            key={shortcut}
            label={`${shortcut} g`}
            accessibilityLabel={`${shortcut} gramas`}
            onPress={() => onChange(String(shortcut))}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
          />
        ))}
      </View>
      {preview && preview.kcal > 0 ? (
        <View
          accessible
          accessibilityLabel={`Isso dá ${spokenKcal(preview.kcal)}: ${spokenGrams(preview.proteinG)} de proteínas, ${spokenGrams(preview.fatG)} de gorduras e ${spokenGrams(preview.carbG)} de carboidratos.`}
          accessibilityLiveRegion="polite"
          className="gap-1 rounded-2xl bg-superficie p-4">
          <AppText variant="numberLarge" className="text-grafite">
            {preview.kcal} kcal
          </AppText>
          <AppText variant="caption" className="text-grafite">
            Proteínas {displayNumber(preview.proteinG)} g · Gorduras {displayNumber(preview.fatG)} g ·
            Carboidratos {displayNumber(preview.carbG)} g
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
