import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { ListRow } from '@/components/ui/list-row';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { RadioList } from '@/components/ui/radio-list';
import { TextButton } from '@/components/ui/text-button';
import { PrimaryButton } from '@/features/auth/primary-button';
import { DEVICE_LABELS, EXAM_TYPE_LABELS, formatExamDate } from '@/features/exams/exam-labels';
import { previewExamRepository, useExamDocuments } from '@/features/exams/exam-repository';
import {
  MAX_FILE_BYTES,
  formatFileSize,
  pickExamImage,
  pickExamPdf,
  takeExamPhoto,
  type PickResult,
  type PickedFile,
} from '@/features/exams/pick-exam-file';
import type { DeviceSource, ExamType } from '@/features/exams/types';
import { uploadAvailability } from '@/features/exams/upload-limit';

// Getters: os textos são lidos na hora de desenhar, no idioma em uso.
const TYPE_OPTIONS = [
  {
    value: 'blood_panel' as const,
    get label() {
      return EXAM_TYPE_LABELS.blood_panel;
    },
    get description() {
      return i18n.t('exams.upload.bloodHint');
    },
  },
  {
    value: 'bioimpedance' as const,
    get label() {
      return EXAM_TYPE_LABELS.bioimpedance;
    },
    get description() {
      return i18n.t('exams.upload.bioHint');
    },
  },
];

const DEVICE_OPTIONS = (['inbody', 'tanita', 'omron', 'other'] as const).map((device) => ({
  value: device,
  get label() {
    return DEVICE_LABELS[device];
  },
}));

export default function UploadExamScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const documents = useExamDocuments();
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [device, setDevice] = useState<Exclude<DeviceSource, 'lab_generic'> | null>(null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availability = examType ? uploadAvailability(documents, examType) : null;
  const blocked = availability !== null && !availability.allowed;

  async function choose(picker: () => Promise<PickResult>) {
    setError(null);
    try {
      const result = await picker();
      if (result.status === 'denied') {
        setError(t('exams.upload.noCamera'));
      } else if (result.status === 'picked') {
        if (result.file.sizeBytes !== null && result.file.sizeBytes > MAX_FILE_BYTES) {
          setError(t('exams.upload.tooBig'));
          return;
        }
        setFile(result.file);
      }
    } catch {
      setError(t('exams.upload.openError'));
    }
  }

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
        options={TYPE_OPTIONS}
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

      {examType && !blocked ? (
        file ? (
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
              onPress={() => setFile(null)}
              textClassName="text-mamao-forte"
              className="self-start"
            />
          </View>
        ) : (
          <View className="gap-2">
            <AppText variant="label" className="text-grafite">
              {t('exams.upload.how')}
            </AppText>
            <View className="rounded-2xl bg-superficie px-4">
              <ListRow
                title={t('exams.upload.camera')}
                description={t('exams.upload.cameraHint')}
                onPress={() => void choose(takeExamPhoto)}
              />
              <ListRow
                title={t('exams.upload.gallery')}
                onPress={() => void choose(pickExamImage)}
              />
              <ListRow
                title={t('exams.upload.pdf')}
                description={t('exams.upload.pdfHint')}
                onPress={() => void choose(pickExamPdf)}
              />
            </View>
            <AppText variant="caption" className="text-grafite-suave">
              {t('exams.upload.photoTips')}
            </AppText>
          </View>
        )
      ) : null}

      <FormError message={error} />

      {file && !blocked ? (
        <PrimaryButton label={t('exams.upload.send')} onPress={send} isLoading={false} />
      ) : null}
    </ScrollView>
  );
}
