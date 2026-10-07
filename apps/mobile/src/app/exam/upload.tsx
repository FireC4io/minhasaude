import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';

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

const TYPE_OPTIONS = [
  {
    value: 'blood_panel',
    label: EXAM_TYPE_LABELS.blood_panel,
    description: 'Glicose, colesterol, creatinina e outros',
  },
  {
    value: 'bioimpedance',
    label: EXAM_TYPE_LABELS.bioimpedance,
    description: 'Gordura, músculo e água do corpo',
  },
] as const;

const DEVICE_OPTIONS = (['inbody', 'tanita', 'omron', 'other'] as const).map((device) => ({
  value: device,
  label: DEVICE_LABELS[device],
}));

export default function UploadExamScreen() {
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
        setError(
          'Sem permissão para usar a câmera. Libere nas configurações do celular ou escolha uma foto da galeria.',
        );
      } else if (result.status === 'picked') {
        if (result.file.sizeBytes !== null && result.file.sizeBytes > MAX_FILE_BYTES) {
          setError(
            'Arquivo grande demais (máximo 10 MB). Tente uma foto com menos zoom ou o PDF do laboratório.',
          );
          return;
        }
        setFile(result.file);
      }
    } catch {
      setError('Não foi possível abrir o arquivo. Tente de novo.');
    }
  }

  function send() {
    if (!examType || !file) return;
    if (examType === 'bioimpedance' && !device) {
      setError(
        'Escolha o aparelho da bioimpedância: medidas de aparelhos diferentes não se comparam.',
      );
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
      <PreviewBanner missing="O arquivo não sai do aparelho: a leitura é simulada com valores de demonstração." />

      <RadioList
        label="Que exame é?"
        options={TYPE_OPTIONS}
        value={examType}
        onChange={setExamType}
      />

      {examType === 'bioimpedance' ? (
        <RadioList
          label="Em qual aparelho foi feito?"
          options={DEVICE_OPTIONS}
          value={device}
          onChange={setDevice}
        />
      ) : null}

      {blocked && availability?.nextDate ? (
        <View className="gap-1 rounded-2xl bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            Você já enviou um exame deste tipo neste mês
          </AppText>
          <AppText className="text-grafite">
            Dá para enviar outro a partir de {formatExamDate(availability.nextDate)}. O limite é de
            um envio por tipo de exame a cada 30 dias.
          </AppText>
        </View>
      ) : null}

      {examType && !blocked ? (
        file ? (
          <View className="gap-3 rounded-2xl bg-superficie p-4">
            <AppText variant="label" className="text-grafite-suave">
              Arquivo escolhido
            </AppText>
            {file.kind === 'image' ? (
              <Image
                source={{ uri: file.uri }}
                accessibilityLabel="Prévia da foto do exame"
                className="h-48 w-full rounded-xl"
                resizeMode="contain"
              />
            ) : null}
            <AppText className="text-grafite">
              {file.kind === 'pdf' ? '📄 ' : ''}
              {file.name} {file.sizeBytes ? `· ${formatFileSize(file.sizeBytes)}` : ''}
            </AppText>
            <TextButton
              label="Trocar arquivo"
              onPress={() => setFile(null)}
              textClassName="text-mamao-forte"
              className="self-start"
            />
          </View>
        ) : (
          <View className="gap-2">
            <AppText variant="label" className="text-grafite">
              Como você quer enviar?
            </AppText>
            <View className="rounded-2xl bg-superficie px-4">
              <ListRow
                title="Tirar foto do exame"
                description="Com a câmera agora"
                onPress={() => void choose(takeExamPhoto)}
              />
              <ListRow
                title="Escolher foto da galeria"
                onPress={() => void choose(pickExamImage)}
              />
              <ListRow
                title="Escolher arquivo PDF"
                description="O PDF do laboratório é o mais fácil de ler"
                onPress={() => void choose(pickExamPdf)}
              />
            </View>
            <AppText variant="caption" className="text-grafite-suave">
              Para a foto sair legível: boa luz, o laudo inteiro na imagem, sem cortar a faixa de
              referência e sem reflexo.
            </AppText>
          </View>
        )
      ) : null}

      <FormError message={error} />

      {file && !blocked ? (
        <PrimaryButton label="Enviar exame" onPress={send} isLoading={false} />
      ) : null}
    </ScrollView>
  );
}
