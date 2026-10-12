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
import { SelectChips } from '@/features/onboarding/select-chips';

import { nutrientsFor } from './food-math';
import { amountLabel, gramsOf, measureKey, measureOption, shortcutLabel, shortcutsFor, type Measure } from './measures';

interface QuantityPickerProps {
  food: Pick<
    FoodResponseDto,
    'kcalPer100g' | 'proteinGPer100g' | 'fatGPer100g' | 'carbGPer100g' | 'micros'
  > | null;
  /** Gramas sempre; onça em inglês; e as medidas caseiras do alimento. */
  measures: readonly Measure[];
  measure: Measure;
  onMeasureChange: (measure: Measure) => void;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Quantidade em gramas ou numa medida caseira (colher, unidade, fatia), com
 * atalhos e a conta já feita: a pessoa vê quanto aquilo dá antes de salvar.
 */
export function QuantityPicker({
  food,
  measures,
  measure,
  onMeasureChange,
  value,
  onChange,
  onSubmit,
}: QuantityPickerProps) {
  const { t } = useTranslation();
  const grams = gramsOf(measure, parseDecimal(value));
  const preview = food ? nutrientsFor(food, grams) : null;
  const byKey = new Map(measures.map((m) => [measureKey(m), m]));
  const keys = [...byKey.keys()];
  const options = measures.map((m) => [measureKey(m), measureOption(m)] as const);

  return (
    <View className="gap-3">
      {measures.length > 1 ? (
        <SelectChips
          label={t('portions.measure')}
          options={keys}
          optionLabels={Object.fromEntries(options.map(([key, o]) => [key, o.label]))}
          optionSpokenLabels={Object.fromEntries(options.map(([key, o]) => [key, o.spoken]))}
          value={measureKey(measure)}
          onChange={(key) => {
            const next = byKey.get(key);
            if (next) onMeasureChange(next);
          }}
        />
      ) : null}
      <AuthTextField
        testID="diary-quantity"
        label={amountLabel(measure)}
        value={value}
        onChangeText={onChange}
        placeholder={t('diary.quantityPlaceholder')}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <View className="flex-row flex-wrap gap-x-4">
        {shortcutsFor(measure).map((shortcut) => {
          const { label, spoken } = shortcutLabel(measure, shortcut);
          return (
            <TextButton
              key={shortcut}
              label={label}
              accessibilityLabel={spoken}
              onPress={() => onChange(String(shortcut))}
              textVariant="bodyStrong"
              textClassName="text-mamao-forte"
            />
          );
        })}
      </View>
      {measure.type === 'portion' ? (
        <AppText variant="caption" className="text-grafite-suave">
          {t('portions.approx')}
        </AppText>
      ) : null}
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
            {measure.type === 'grams' ? '' : `${displayNumber(grams, 0)} g · `}
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
