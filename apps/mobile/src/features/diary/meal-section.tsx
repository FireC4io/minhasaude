import { View } from 'react-native';
import type { DiaryEntryResponseDto, MealType } from '@/api/generated/models';
import { TextButton } from '@/components/ui/text-button';
import { describeMealHeader } from './accessibility-labels';
import { DiaryEntryRow } from './diary-entry-row';
import { MEAL_TYPE_LABELS } from './meal-type-labels';
import { AppText } from '@/components/ui/app-text';

interface MealSectionProps {
  mealType: MealType;
  entries: DiaryEntryResponseDto[];
  onEntryPress: (entry: DiaryEntryResponseDto) => void;
  onEntryDelete: (entry: DiaryEntryResponseDto) => void;
  onAddPress: () => void;
}

function round(value: number): number {
  return Math.round(value);
}

export function MealSection({ mealType, entries, onEntryPress, onEntryDelete, onAddPress }: MealSectionProps) {
  const label = MEAL_TYPE_LABELS[mealType];
  const kcalTotal = entries.reduce((sum, entry) => sum + Number(entry.kcalSnapshot), 0);

  return (
    <View className="gap-2">
      {/* Cabeçalho lido como uma parada só: dá pra pular de refeição em
          refeição pelo rotor de cabeçalhos e já ouvir o total. */}
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={describeMealHeader(label, entries.length, kcalTotal)}
        className="flex-row items-center justify-between">
        <AppText variant="bodyStrong" className="text-grafite">{label}</AppText>
        {entries.length > 0 ? <AppText variant="caption" className="text-grafite">{round(kcalTotal)} kcal</AppText> : null}
      </View>

      <View className="gap-2">
        {entries.map((entry) => (
          <DiaryEntryRow
            key={entry.id}
            entry={entry}
            onPress={() => onEntryPress(entry)}
            onDelete={() => onEntryDelete(entry)}
          />
        ))}
      </View>

      <TextButton
        label="+ Adicionar alimento"
        accessibilityLabel={`Adicionar alimento ao ${label.toLowerCase()}`}
        onPress={onAddPress}
        className="self-start"
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
      />
    </View>
  );
}
