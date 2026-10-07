import { TextInput, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { PreviewTag } from '@/components/ui/preview-tag';
import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { usePreviewValue } from '@/features/preview/preview-store';

/** Notas do dia (prévia — sem API ainda, o texto fica só na memória). */
export function NotesCard({ date }: { date: string }) {
  const { t } = useTranslation();
  const [note, setNote] = usePreviewValue(`notes:${date}`, '');
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <View className="gap-2 rounded-2xl bg-superficie p-4">
      <View className="flex-row items-center gap-2">
        <AppText variant="label" className="text-grafite-suave">
          {t('notes.title')}
        </AppText>
        <PreviewTag />
      </View>
      <TextInput
        accessibilityLabel={t('notes.title')}
        accessibilityHint={t('notes.hint')}
        value={note}
        onChangeText={setNote}
        placeholder={t('notes.placeholder')}
        placeholderTextColor={colors.grafiteSuave}
        multiline
        textAlignVertical="top"
        className="min-h-[96px] rounded-xl border border-linha bg-areia p-3 font-body text-base text-grafite"
      />
    </View>
  );
}
