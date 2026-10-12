import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DiaryEntryResponseDto } from '@/api/generated/models';
import { TextButton } from '@/components/ui/text-button';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { isPendingEntry } from '@/features/offline-queue/merge-pending';
import { describeDiaryEntry } from './accessibility-labels';
import { describeAmount } from './measures';
import { AppText } from '@/components/ui/app-text';

interface DiaryEntryRowProps {
  entry: DiaryEntryResponseDto;
  onPress: () => void;
  onDelete: () => void;
}

export function DiaryEntryRow({ entry, onPress, onDelete }: Readonly<DiaryEntryRowProps>) {
  const { t } = useTranslation();
  const amount = describeAmount(entry);
  // Guardada sem internet: aparece, soma nas calorias, mas só dá para editar depois de enviada.
  const pending = isPendingEntry(entry);
  const spoken = describeDiaryEntry({
    foodName: entry.food.name,
    amountSpoken: amount.spoken,
    kcal: entry.kcalSnapshot,
  });
  // Editar e remover são irmãos, não um botão dentro do outro: um Pressable
  // acessível engole os filhos, e o "Remover" sumiria para o leitor de tela.
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-linha bg-superficie px-3">
      <Pressable
        onPress={onPress}
        disabled={pending}
        accessibilityRole={pending ? undefined : 'button'}
        accessibilityLabel={pending ? `${spoken}. ${t('offline.entryWaiting')}` : spoken}
        accessibilityHint={pending ? undefined : t('diary.editHint')}
        style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        className="flex-1 gap-0.5 py-2 pr-2">
        {/* Sem corte: com fonte grande o nome quebra linha em vez de virar "Banana, prata, cr…" (#32). */}
        <AppText className="text-grafite">
          {entry.food.name}
        </AppText>
        <AppText variant="caption" className="text-grafite">
          {amount.text} · {Math.round(Number(entry.kcalSnapshot))} kcal
        </AppText>
        {pending ? (
          <AppText variant="caption" className="text-grafite-suave">
            {t('offline.entryWaiting')}
          </AppText>
        ) : null}
      </Pressable>
      <TextButton
        label={t('diary.removeShort')}
        // Numa lista com vários "Remover", o nome precisa dizer qual.
        accessibilityLabel={t('diary.removeShortSpoken', { food: entry.food.name })}
        // Sem pergunta de confirmação: a tela oferece "Desfazer" logo depois (F4-16).
        onPress={onDelete}
        className="items-end"
        textVariant="caption"
        textClassName="text-jabuticaba"
      />
    </View>
  );
}
