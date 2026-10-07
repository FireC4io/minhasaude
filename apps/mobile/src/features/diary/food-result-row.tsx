import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { spokenGrams, spokenKcal } from '@/features/accessibility/spoken-format';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

interface FoodResultRowProps {
  food: FoodResponseDto;
  /** Nos recentes: a quantidade usada da última vez. */
  lastQuantity?: number;
  onPress: () => void;
}

/** Alimento numa lista de busca ou de recentes, com kcal por 100 g para comparar (F4-16). */
export function FoodResultRow({ food, lastQuantity, onPress }: FoodResultRowProps) {
  const { t } = useTranslation();
  const kcal = Math.round(Number(food.kcalPer100g));
  const details = [
    food.brand,
    t('diary.perHundred', { kcal }),
    lastQuantity ? t('diary.lastTime', { grams: lastQuantity }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${food.brand ? `${food.name}, ${food.brand}` : food.name}. ${t(
        'diary.resultSpoken',
        { kcal: spokenKcal(kcal) },
      )}${lastQuantity ? t('diary.resultSpokenLast', { grams: spokenGrams(lastQuantity) }) : ''}`}
      accessibilityHint={t('diary.chooseHint')}
      style={{ minHeight: MIN_TOUCH_TARGET }}
      className="justify-center border-b border-linha py-3 active:opacity-70">
      <View className="gap-0.5">
        <AppText className="text-grafite">{food.name}</AppText>
        <AppText variant="caption" className="text-grafite-suave">
          {details}
        </AppText>
      </View>
    </Pressable>
  );
}
