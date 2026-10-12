import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

import { formatFileSize, type PickedFile } from '../pick-exam-file';

interface ChosenFileCardProps {
  file: PickedFile;
  onChange: () => void;
}

/** O arquivo escolhido (prévia da foto ou nome do PDF), com o atalho para trocar. */
export function ChosenFileCard({ file, onChange }: ChosenFileCardProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="label" className="text-grafite-suave">
        {t('exams.upload.chosen')}
      </AppText>
      {file.kind === 'image' ? (
        <Image
          source={{ uri: file.uri }}
          accessibilityLabel={t('exams.upload.photoPreview')}
          className="h-48 w-full rounded-xl"
          resizeMode="contain"
        />
      ) : null}
      <AppText className="text-grafite">
        {file.kind === 'pdf' ? '📄 ' : ''}
        {file.name} {file.sizeBytes ? `· ${formatFileSize(file.sizeBytes)}` : ''}
      </AppText>
      <TextButton
        label={t('exams.upload.change')}
        onPress={onChange}
        textClassName="text-mamao-forte"
        className="self-start"
      />
    </View>
  );
}
