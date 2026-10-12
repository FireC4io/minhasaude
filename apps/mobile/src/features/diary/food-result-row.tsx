import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { spokenKcal } from '@/features/accessibility/spoken-format';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

interface FoodResultRowProps {
  food: FoodResponseDto;
  /** Nos recentes: a quantidade usada da última vez ("2 colheres de sopa (50 g)"). */
  lastAmount?: { text: string; spoken: string };
  onPress: () => void;
}

/** Alimento numa lista de busca ou de recentes, com kcal por 100 g para comparar (F4-16). */
export function FoodResultRow({ food, lastAmount, onPress }: Readonly<FoodResultRowProps>) {
  const { t } = useTranslation();
  const kcal = Math.round(Number(food.kcalPer100g));
  const details = [
    food.brand,
    // Crédito da fonte quando não é a tabela brasileira: o número é de alimento americano.
    food.source === 'usda' ? t('diary.sourceUsda') : null,
    t('diary.perHundred', { kcal }),
    lastAmount ? t('diary.lastTime', { amount: lastAmount.text }) : null,
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
      )}${lastAmount ? t('diary.resultSpokenLast', { amount: lastAmount.spoken }) : ''}`}
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
