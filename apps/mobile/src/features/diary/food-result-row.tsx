import { Pressable, View } from 'react-native';

import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

interface FoodResultRowProps {
  food: FoodResponseDto;
  /** Nos recentes: a quantidade usada da última vez. */
  lastQuantity?: number;
  onPress: () => void;
}

/** Alimento numa lista de busca ou de recentes, com kcal por 100 g para comparar (F4-16). */
export function FoodResultRow({ food, lastQuantity, onPress }: FoodResultRowProps) {
  const kcal = Math.round(Number(food.kcalPer100g));
  const details = [food.brand, `${kcal} kcal em 100 g`, lastQuantity ? `última vez ${lastQuantity} g` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}. ${details.replace('kcal', 'quilocalorias').replace(/ g\b/g, ' gramas')}`}
      accessibilityHint="Escolhe este alimento"
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
