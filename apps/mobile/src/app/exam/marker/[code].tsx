import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ExamDisclaimer } from '@/features/exams/exam-disclaimer';
import { formatExamDate, formatExamValue } from '@/features/exams/exam-labels';
import { useExamDocuments } from '@/features/exams/exam-repository';
import { MarkerChart } from '@/features/exams/marker-chart';
import { markerInfo } from '@/features/exams/marker-catalog';
import { ResultRow } from '@/features/exams/result-row';

/** Evolução de um marcador entre os exames revisados. */
export default function MarkerHistoryScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const info = markerInfo(code);
  const documents = useExamDocuments();

  const history = documents
    .filter((document) => document.status === 'reviewed')
    .flatMap((document) =>
      document.results
        .filter((result) => result.markerCode === code && result.confirmedValue !== null)
        .map((result) => ({ document, result })),
    )
    .sort((a, b) => (a.document.collectedAt ?? '').localeCompare(b.document.collectedAt ?? ''));

  const unit = history[0]?.result.confirmedUnit ?? info.canonicalUnit;
  const points = history.map(({ document, result }) => ({
    date: document.collectedAt ?? document.uploadedAt.slice(0, 10),
    value: result.confirmedValue as number,
  }));
  const description =
    points.length >= 2
      ? `${info.displayName}: ${points
          .map(
            (point) => `${formatExamValue(point.value)} ${unit} em ${formatExamDate(point.date)}`,
          )
          .join('; ')}.`
      : '';

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <View className="gap-2">
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          {info.displayName}
        </AppText>
        {info.whatItMeasures ? (
          <AppText className="text-grafite">O que é: {info.whatItMeasures}</AppText>
        ) : null}
      </View>

      {points.length >= 2 ? (
        <MarkerChart points={points} unit={unit} description={description} />
      ) : (
        <AppText className="text-grafite-suave">
          Com dois ou mais exames revisados, a evolução aparece num gráfico aqui.
        </AppText>
      )}

      <View className="gap-1">
        <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
          Exame a exame
        </AppText>
        <View className="rounded-2xl bg-superficie px-4">
          {[...history].reverse().map(({ document, result }) => (
            <View key={result.id}>
              <AppText variant="caption" className="pt-3 text-grafite-suave">
                {formatExamDate(document.collectedAt)}
              </AppText>
              <ResultRow result={result} />
            </View>
          ))}
        </View>
      </View>

      <AppText variant="caption" className="text-grafite-suave">
        Laboratórios diferentes podem usar métodos e faixas de referência diferentes. Por isso cada
        valor é comparado com a faixa do seu próprio laudo.
      </AppText>
      <ExamDisclaimer />
    </ScrollView>
  );
}
