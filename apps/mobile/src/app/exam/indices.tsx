import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useUsersControllerGetMe } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { computeIndicesFor, type ComputedIndex } from '@/features/exams/compute-indices';
import { ExamDisclaimer } from '@/features/exams/exam-disclaimer';
import { formatExamDate, formatExamValue } from '@/features/exams/exam-labels';
import { useExamDocuments } from '@/features/exams/exam-repository';
import { markerInfo } from '@/features/exams/marker-catalog';
import { appLocale } from '@/i18n/format';

/**
 * Índices calculados de um exame revisado: número, fórmula, valores usados,
 * versão da fórmula e referência. Sem rótulo clínico (RDC 657/2022).
 */
export default function IndicesScreen() {
  const { t } = useTranslation();
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
          {t('examsMore.indicesEmpty')}
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
      <PreviewBanner missing={t('examsMore.indicesPreview')} />
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
  const { t } = useTranslation();
  const { calculator, value, inputs, missing } = index;
  const formatted =
    value === null
      ? null
      : `${value.toLocaleString(appLocale(), {
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
          ? t('examsMore.indexSpoken', {
              name: calculator.displayName,
              value: formatted,
              formula: calculator.formula,
              used: usedValues,
            })
          : t('examsMore.indexMissingSpoken', {
              name: calculator.displayName,
              reason:
                missing.length > 0
                  ? t('examsMore.missingSpoken', {
                      items: missing.map((code) => markerInfo(code).displayName).join(', '),
                    })
                  : t('examsMore.missingProfileSpoken'),
            })
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
            ? t('examsMore.notCalculated', {
                items: missing
                  .map((code) => markerInfo(code).displayName.toLowerCase())
                  .join(t('examsMore.and')),
              })
            : t('examsMore.notCalculatedProfile')}
        </AppText>
      )}
      <AppText variant="caption" className="text-grafite">
        {t('examsMore.formula', { formula: calculator.formula })}
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
