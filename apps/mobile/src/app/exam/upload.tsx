import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { RadioList } from '@/components/ui/radio-list';
import { PrimaryButton } from '@/features/auth/primary-button';
import { formatExamDate } from '@/features/exams/exam-labels';
import { previewExamRepository, useExamDocuments } from '@/features/exams/exam-repository';
import type { DeviceSource, ExamType } from '@/features/exams/types';
import { ChosenFileCard } from '@/features/exams/upload/chosen-file-card';
import { FileSourcePicker } from '@/features/exams/upload/file-source-picker';
import { DEVICE_OPTIONS, EXAM_TYPE_OPTIONS } from '@/features/exams/upload/upload-options';
import { useExamFile } from '@/features/exams/upload/use-exam-file';
import { uploadAvailability } from '@/features/exams/upload-limit';

/** Envio de exame (prévia): tipo, aparelho da bioimpedância, arquivo e o limite de um por tipo a cada 30 dias. */
export default function UploadExamScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const documents = useExamDocuments();
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [device, setDevice] = useState<Exclude<DeviceSource, 'lab_generic'> | null>(null);
  const { file, clearFile, choose, error, setError } = useExamFile();

  const availability = examType ? uploadAvailability(documents, examType) : null;
  const blocked = availability !== null && !availability.allowed;

  function send() {
    if (!examType || !file) return;
    if (examType === 'bioimpedance' && !device) {
      setError(t('exams.upload.chooseDevice'));
      return;
    }
    const document = previewExamRepository.upload({
      examType,
      deviceSource: examType === 'blood_panel' ? 'lab_generic' : (device as DeviceSource),
      fileName: file.name,
    });
    router.replace({ pathname: '/exam/[id]', params: { id: document.id } });
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <PreviewBanner missing={t('exams.upload.preview')} />

      <RadioList
        label={t('exams.upload.whichExam')}
        options={EXAM_TYPE_OPTIONS}
        value={examType}
        onChange={setExamType}
      />

      {examType === 'bioimpedance' ? (
        <RadioList
          label={t('exams.upload.whichDevice')}
          options={DEVICE_OPTIONS}
          value={device}
          onChange={setDevice}
        />
      ) : null}

      {blocked && availability?.nextDate ? (
        <View className="gap-1 rounded-2xl bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            {t('exams.upload.limitTitle')}
          </AppText>
          <AppText className="text-grafite">
            {t('exams.upload.limitText', { date: formatExamDate(availability.nextDate) })}
          </AppText>
        </View>
      ) : null}

      {examType && !blocked && file ? <ChosenFileCard file={file} onChange={clearFile} /> : null}
      {examType && !blocked && !file ? <FileSourcePicker onChoose={(picker) => void choose(picker)} /> : null}

      <FormError message={error} />

      {file && !blocked ? <PrimaryButton label={t('exams.upload.send')} onPress={send} isLoading={false} /> : null}
    </ScrollView>
  );
}
