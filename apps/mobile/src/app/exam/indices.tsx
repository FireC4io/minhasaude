import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { useUsersControllerGetMe } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { computeIndicesFor, type ComputedIndex } from '@/features/exams/compute-indices';
import { ExamDisclaimer } from '@/features/exams/exam-disclaimer';
import { formatExamDate, formatExamValue } from '@/features/exams/exam-labels';
import { useExamDocuments } from '@/features/exams/exam-repository';
import { markerInfo } from '@/features/exams/marker-catalog';

/**
 * Índices calculados de um exame revisado: número, fórmula, valores usados,
 * versão da fórmula e referência. Sem rótulo clínico (RDC 657/2022).
 */
export default function IndicesScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const documents = useExamDocuments();
  const meQuery = useUsersControllerGetMe();

  const reviewed = documents
    .filter((document) => document.status === 'reviewed' && document.examType === 'blood_panel')
    .sort((a, b) => (b.collectedAt ?? '').localeCompare(a.collectedAt ?? ''));
  const document = reviewed.find((candidate) => candidate.id === id) ?? reviewed[0];

  if (!document) {
    return (
      <View className="flex-1 bg-areia px-6 py-6">
        <AppText className="text-grafite">
          Os índices aparecem depois que você enviar e conferir um exame de sangue.
        </AppText>
      </View>
    );
  }

  const profile = meQuery.data?.profile;
  const indices = computeIndicesFor(document, {
    birthDate: profile?.birthDate ?? null,
    sex: profile?.sex ?? null,
  });

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-5 px-6 py-6">
      <PreviewBanner missing="Calculados a partir do exame de demonstração. As fórmulas são as reais e têm testes." />
      <AppText className="text-grafite">
        A partir do exame de {formatExamDate(document.collectedAt)}. São fórmulas conhecidas na
        literatura, feitas com os valores que você conferiu.
      </AppText>

      {indices.map((index) => (
        <IndexCard key={index.calculator.code} index={index} />
      ))}

      <ExamDisclaimer />
    </ScrollView>
  );
}

function IndexCard({ index }: { index: ComputedIndex }) {
  const { calculator, value, inputs, missing } = index;
  const formatted =
    value === null
      ? null
      : `${value.toLocaleString('pt-BR', {
          minimumFractionDigits: calculator.decimals,
          maximumFractionDigits: calculator.decimals,
        })}${calculator.unit ? ` ${calculator.unit}` : ''}`;
  const usedValues = Object.entries(inputs)
    .map(([code, input]) => `${markerInfo(code).displayName} ${formatExamValue(input)}`)
    .join(' · ');

  return (
    <View
      accessible
      accessibilityLabel={
        formatted
          ? `${calculator.displayName}: ${formatted}. Fórmula: ${calculator.formula}. Valores usados: ${usedValues}.`
          : `${calculator.displayName}: não calculado. ${
              missing.length > 0
                ? `Falta: ${missing.map((code) => markerInfo(code).displayName).join(', ')}.`
                : 'Falta a data de nascimento ou o sexo no seu perfil.'
            }`
      }
      className="gap-2 rounded-2xl bg-superficie p-4">
      <AppText variant="bodyStrong" className="text-grafite">
        {calculator.displayName}
      </AppText>
      {formatted ? (
        <AppText variant="numberLarge" className="text-grafite">
          {formatted}
        </AppText>
      ) : (
        <AppText className="text-grafite-suave">
          {missing.length > 0
            ? `Não calculado: o exame não tem ${missing
                .map((code) => markerInfo(code).displayName.toLowerCase())
                .join(' e ')} conferido.`
            : 'Não calculado: precisa da data de nascimento e do sexo no seu perfil.'}
        </AppText>
      )}
      <AppText variant="caption" className="text-grafite">
        Fórmula: {calculator.formula}
      </AppText>
      {formatted ? (
        <AppText variant="caption" className="text-grafite">
          Valores usados: {usedValues}
        </AppText>
      ) : null}
      <AppText variant="caption" className="text-grafite-suave">
        Fonte: {calculator.reference} Versão da fórmula: {calculator.version}.
      </AppText>
    </View>
  );
}
