import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-row';

import { pickExamImage, pickExamPdf, takeExamPhoto, type PickResult } from '../pick-exam-file';

interface FileSourcePickerProps {
  onChoose: (picker: () => Promise<PickResult>) => void;
}

/** Câmera, galeria ou PDF, com as dicas para a foto sair legível. */
export function FileSourcePicker({ onChoose }: FileSourcePickerProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-2">
      <AppText variant="label" className="text-grafite">
        {t('exams.upload.how')}
      </AppText>
      <View className="rounded-2xl bg-superficie px-4">
        <ListRow
          title={t('exams.upload.camera')}
          description={t('exams.upload.cameraHint')}
          onPress={() => onChoose(takeExamPhoto)}
        />
        <ListRow title={t('exams.upload.gallery')} onPress={() => onChoose(pickExamImage)} />
        <ListRow
          title={t('exams.upload.pdf')}
          description={t('exams.upload.pdfHint')}
          onPress={() => onChoose(pickExamPdf)}
        />
      </View>
      <AppText variant="caption" className="text-grafite-suave">
        {t('exams.upload.photoTips')}
      </AppText>
    </View>
  );
}
