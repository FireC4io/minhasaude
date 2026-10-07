import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const document = useExamDocument(id);
  useAnnounce(document?.status === 'extracted' ? t('exams.detail.readAnnounce') : null);

  if (!document) {
    return (
      <View className="flex-1 gap-4 bg-areia px-6 py-6">
        <AppText className="text-grafite">
          {t('exams.detail.notFound')}
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
          <LoadingIndicator label={t('exams.detail.reading')} />
          <AppText className="text-center text-grafite">
            {t('exams.detail.readingText')}
          </AppText>
        </View>
      ) : null}

      {document.status === 'failed' ? (
        <View className="gap-2 rounded-2xl bg-superficie p-4">
          <AppText className="text-grafite">
            {t('exams.detail.failed')}
          </AppText>
        </View>
      ) : null}

      {document.status === 'extracted' ? (
        <View className="gap-3 rounded-2xl bg-superficie p-4">
          <AppText className="text-grafite">
            {t('exams.detail.read', { count: document.results.length })}
          </AppText>
          <PrimaryButton
            label={t('exams.detail.check')}
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
            label={t('exams.detail.indices')}
            onPress={() => router.push({ pathname: '/exam/indices', params: { id: document.id } })}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
            className="self-start"
          />
          <ExamDisclaimer />
        </>
      ) : null}

      <TextButton
        label={t('exams.detail.delete')}
        accessibilityLabel={t('exams.detail.deleteSpoken', {
          date: formatExamDate(document.collectedAt ?? document.uploadedAt),
        })}
        onPress={remove}
        textVariant="bodyStrong"
        textClassName="text-jabuticaba"
        className="self-start"
      />
    </ScrollView>
  );
}
