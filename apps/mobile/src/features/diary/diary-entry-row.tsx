import { Pressable, View } from 'react-native';
import type { DiaryEntryResponseDto } from '@/api/generated/models';
import { TextButton } from '@/components/ui/text-button';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { describeDiaryEntry } from './accessibility-labels';
import { AppText } from '@/components/ui/app-text';

interface DiaryEntryRowProps {
  entry: DiaryEntryResponseDto;
  onPress: () => void;
  onDelete: () => void;
}

export function DiaryEntryRow({ entry, onPress, onDelete }: DiaryEntryRowProps) {
  // Editar e remover são irmãos, não um botão dentro do outro: um Pressable
  // acessível engole os filhos, e o "Remover" sumiria para o leitor de tela.
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-linha bg-superficie px-3">
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
        <AppText className="text-grafite" numberOfLines={1}>
          {entry.food.name}
        </AppText>
        <AppText variant="caption" className="text-grafite">
          {Number(entry.quantity)} g · {Math.round(Number(entry.kcalSnapshot))} kcal
        </AppText>
      </Pressable>
      <TextButton
        label="Remover"
        // Numa lista com vários "Remover", o nome precisa dizer qual.
        accessibilityLabel={`Remover ${entry.food.name}`}
        // Sem pergunta de confirmação: a tela oferece "Desfazer" logo depois (F4-16).
        onPress={onDelete}
        className="items-end"
        textVariant="caption"
        textClassName="text-jabuticaba"
      />
    </View>
  );
}
