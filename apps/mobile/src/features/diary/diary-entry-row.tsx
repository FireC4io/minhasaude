import { Alert, Pressable, Text, View } from 'react-native';
import type { DiaryEntryResponseDto } from '@/api/generated/models';
import { TextButton } from '@/components/ui/text-button';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { describeDiaryEntry } from './accessibility-labels';

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

  // Editar e remover são irmãos, não um botão dentro do outro: um Pressable
  // acessível engole os filhos, e o "Remover" sumiria para o leitor de tela.
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-grafite bg-superficie px-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={describeDiaryEntry({
          foodName: entry.food.name,
          quantity: entry.quantity,
          kcal: entry.kcalSnapshot,
        })}
        accessibilityHint="Abre para editar a quantidade"
        style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        className="flex-1 gap-0.5 py-2 pr-2">
        <Text className="text-base text-grafite" numberOfLines={1}>
          {entry.food.name}
        </Text>
        <Text className="text-xs text-grafite">
          {Number(entry.quantity)}g · {Math.round(Number(entry.kcalSnapshot))} kcal
        </Text>
      </Pressable>
      <TextButton
        label="Remover"
        // Numa lista com vários "Remover", o nome precisa dizer qual.
        accessibilityLabel={`Remover ${entry.food.name}`}
        onPress={confirmDelete}
        className="items-end"
        textClassName="text-sm text-jabuticaba"
      />
    </View>
  );
}
