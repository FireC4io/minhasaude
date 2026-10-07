import { TextInput, useColorScheme, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PreviewTag } from '@/components/ui/preview-tag';
import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { usePreviewValue } from '@/features/preview/preview-store';

/** Notas do dia (prévia — sem API ainda, o texto fica só na memória). */
export function NotesCard({ date }: { date: string }) {
  const [note, setNote] = usePreviewValue(`notes:${date}`, '');
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <View className="gap-2 rounded-2xl bg-superficie p-4">
      <View className="flex-row items-center gap-2">
        <AppText variant="label" className="text-grafite-suave">
          Notas do dia
        </AppText>
        <PreviewTag />
      </View>
      <TextInput
        accessibilityLabel="Notas do dia"
        accessibilityHint="Prévia: o texto não fica salvo ao fechar o app"
        value={note}
        onChangeText={setNote}
        placeholder="Como foi o seu dia?"
        placeholderTextColor={colors.grafiteSuave}
        multiline
        textAlignVertical="top"
        className="min-h-[96px] rounded-xl border border-linha bg-areia p-3 font-body text-base text-grafite"
      />
    </View>
  );
}
