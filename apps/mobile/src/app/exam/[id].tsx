import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { PrimaryButton } from '@/features/auth/primary-button';
import { ExamDisclaimer } from '@/features/exams/exam-disclaimer';
import {
  DEVICE_LABELS,
  EXAM_TYPE_LABELS,
  STATUS_LABELS,
  formatExamDate,
} from '@/features/exams/exam-labels';
import { previewExamRepository, useExamDocument } from '@/features/exams/exam-repository';
import { CATEGORY_LABELS, CATEGORY_ORDER, markerInfo } from '@/features/exams/marker-catalog';
import { ResultRow } from '@/features/exams/result-row';

export default function ExamDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const document = useExamDocument(id);
  useAnnounce(document?.status === 'extracted' ? 'Leitura concluída. Confira os valores.' : null);

  if (!document) {
    return (
      <View className="flex-1 gap-4 bg-areia px-6 py-6">
        <AppText className="text-grafite">
          Este exame não foi encontrado. Ele pode ter sido apagado.
        </AppText>
      </View>
    );
  }

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    results: document.results.filter(
      (result) => markerInfo(result.markerCode).category === category,
    ),
  })).filter((group) => group.results.length > 0);

  function remove() {
    previewExamRepository.remove(document?.id ?? '');
    router.back();
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <View className="gap-1">
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          {EXAM_TYPE_LABELS[document.examType]}
        </AppText>
        <AppText className="text-grafite">
          {formatExamDate(document.collectedAt ?? document.uploadedAt)}
          {document.labName ? ` · ${document.labName}` : ''}
          {document.deviceSource && document.examType === 'bioimpedance'
            ? ` · ${DEVICE_LABELS[document.deviceSource]}`
            : ''}
        </AppText>
        <AppText variant="label" accessibilityLiveRegion="polite" className="text-grafite-suave">
          {STATUS_LABELS[document.status]}
        </AppText>
      </View>

      {document.status === 'processing' || document.status === 'pending' ? (
        <View className="gap-3 rounded-2xl bg-superficie p-4">
          <LoadingIndicator label="Lendo os valores do exame" />
          <AppText className="text-center text-grafite">
            Estamos lendo os valores do laudo. Pode levar alguns minutos — você pode sair desta tela
            e voltar depois.
          </AppText>
        </View>
      ) : null}

      {document.status === 'failed' ? (
        <View className="gap-2 rounded-2xl bg-superficie p-4">
          <AppText className="text-grafite">
            Não conseguimos ler este arquivo. Tente uma foto com mais luz e com o laudo inteiro, ou
            o PDF do laboratório.
          </AppText>
        </View>
      ) : null}

      {document.status === 'extracted' ? (
        <View className="gap-3 rounded-2xl bg-superficie p-4">
          <AppText className="text-grafite">
            Lemos {document.results.length} valores. Confira cada um com o laudo antes de usarmos: a
            leitura automática pode errar.
          </AppText>
          <PrimaryButton
            label="Conferir os valores"
            onPress={() =>
              router.push({ pathname: '/exam/review/[id]', params: { id: document.id } })
            }
            isLoading={false}
          />
        </View>
      ) : null}

      {document.status === 'reviewed' ? (
        <>
          {byCategory.map(({ category, results }) => (
            <View key={category} className="gap-1">
              <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
                {CATEGORY_LABELS[category]}
              </AppText>
              <View className="rounded-2xl bg-superficie px-4">
                {results.map((result) => (
                  <ResultRow
                    key={result.id}
                    result={result}
                    onPress={() =>
                      router.push({
                        pathname: '/exam/marker/[code]',
                        params: { code: result.markerCode },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ))}
          <TextButton
            label="Ver índices calculados deste exame"
            onPress={() => router.push({ pathname: '/exam/indices', params: { id: document.id } })}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
            className="self-start"
          />
          <ExamDisclaimer />
        </>
      ) : null}

      <TextButton
        label="Apagar este exame"
        accessibilityLabel={`Apagar o exame de ${formatExamDate(document.collectedAt ?? document.uploadedAt)}`}
        onPress={remove}
        textVariant="bodyStrong"
        textClassName="text-jabuticaba"
        className="self-start"
      />
    </ScrollView>
  );
}
