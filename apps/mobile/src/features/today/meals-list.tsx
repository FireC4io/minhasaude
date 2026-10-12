import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { DailySummaryResponseDto, DiaryEntryResponseDto, MealType } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';
import { MealSection } from '@/features/diary/meal-section';
import { MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';

import { dayHasEntries } from './use-week-entries';

interface MealsListProps {
  day: DailySummaryResponseDto;
  /** Dia vazio com o anterior anotado: oferece copiar (achado #10). */
  canCopyPrevious: boolean;
  isCopying: boolean;
  onCopyPrevious: () => void;
  onAdd: (mealType: MealType) => void;
  onEdit: (entry: DiaryEntryResponseDto) => void;
  onRemove: (entry: DiaryEntryResponseDto) => void;
}

/** As quatro refeições do dia, com o aviso de dia vazio e o atalho de copiar o anterior. */
export function MealsList({ day, canCopyPrevious, isCopying, onCopyPrevious, onAdd, onEdit, onRemove }: Readonly<MealsListProps>) {
  const { t } = useTranslation();
  return (
    <View className="gap-4">
      <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
        {t('today.meals')}
      </AppText>
      {!dayHasEntries(day) ? <AppText className="text-grafite-suave">{t('today.empty')}</AppText> : null}
      {canCopyPrevious ? (
        <TextButton
          label={isCopying ? t('today.copying') : t('today.copyPrevious')}
          onPress={onCopyPrevious}
          busy={isCopying}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
          className="self-start"
        />
      ) : null}
      {MEAL_TYPE_ORDER.map((mealType) => (
        <MealSection
          key={mealType}
          mealType={mealType}
          entries={day.meals[mealType]}
          onEntryPress={onEdit}
          onEntryDelete={onRemove}
          onAddPress={() => onAdd(mealType)}
        />
      ))}
    </View>
  );
}
