import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

interface ChosenFoodHeaderProps {
  food: FoodResponseDto;
  onChange: () => void;
}

/** O alimento escolhido, com o atalho para voltar à busca. */
export function ChosenFoodHeader({ food, onChange }: ChosenFoodHeaderProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-1">
      <AppText
        variant="bodyStrong"
        accessibilityLabel={t('diary.chosen', { food: food.name })}
        className="text-grafite">
        {food.name}
      </AppText>
      <TextButton
        label={t('diary.change')}
        onPress={onChange}
        hint={t('diary.changeHint')}
        className="self-start"
        textClassName="text-mamao-forte"
      />
    </View>
  );
}
