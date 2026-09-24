import { Alert, Pressable, Text, View } from 'react-native';
import type { DiaryEntryResponseDto } from '@/api/generated/models';

interface DiaryEntryRowProps {
  entry: DiaryEntryResponseDto;
  onPress: () => void;
  onDelete: () => void;
}

export function DiaryEntryRow({ entry, onPress, onDelete }: DiaryEntryRowProps) {
  function confirmDelete() {
    Alert.alert('Remover entrada', `Remover "${entry.food.name}" do diário?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-xl border border-grafite bg-superficie px-3 py-2">
      <View className="flex-1 gap-0.5 pr-2">
        <Text className="text-base text-grafite" numberOfLines={1}>
          {entry.food.name}
        </Text>
        <Text className="text-xs text-grafite">
          {Number(entry.quantity)}g · {Math.round(Number(entry.kcalSnapshot))} kcal
        </Text>
      </View>
      <Pressable onPress={confirmDelete} hitSlop={8}>
        <Text className="text-sm text-jabuticaba">Remover</Text>
      </Pressable>
    </Pressable>
  );
}
