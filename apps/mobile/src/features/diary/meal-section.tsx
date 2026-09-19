import { Pressable, Text, View } from 'react-native';
import type { DiaryEntryResponseDto, MealType } from '@/api/generated/models';
import { DiaryEntryRow } from './diary-entry-row';
import { MEAL_TYPE_LABELS } from './meal-type-labels';

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
  const kcalTotal = entries.reduce((sum, entry) => sum + Number(entry.kcalSnapshot), 0);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-grafite">{MEAL_TYPE_LABELS[mealType]}</Text>
        {entries.length > 0 ? <Text className="text-sm text-grafite">{round(kcalTotal)} kcal</Text> : null}
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

      <Pressable onPress={onAddPress} className="self-start">
        <Text className="font-semibold text-mamao">+ Adicionar alimento</Text>
      </Pressable>
    </View>
  );
}
