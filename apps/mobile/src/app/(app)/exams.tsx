import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-row';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { PREVIEW_FEATURES } from '@/config/features';
import { PrimaryButton } from '@/features/auth/primary-button';
import { useExamConsent, useExamDocuments } from '@/features/exams/exam-repository';
import { EXAM_TYPE_LABELS, STATUS_LABELS, formatExamDate } from '@/features/exams/exam-labels';

/** Aba Exames (Fase 5). Enquanto não houver API, só existe como prévia. */
export default function ExamsScreen() {
  if (!PREVIEW_FEATURES) return <ExamsComingSoon />;
  return <ExamsHome />;
}

function ExamsHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const [hasConsent] = useExamConsent();
  const documents = useExamDocuments();
  const bloodPanels = documents.filter((document) => document.examType === 'blood_panel');
  const waitingReview = documents.filter((document) => document.status === 'extracted');

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          {t('exams.title')}
        </AppText>
        <PreviewBanner missing={t('exams.home.preview')} />

        {!hasConsent ? (
          <View className="gap-3 rounded-2xl bg-superficie p-4">
            <AppText variant="subtitle" className="text-grafite">
              {t('exams.home.introTitle')}
            </AppText>
            <AppText className="text-grafite">
              {t('exams.home.introText')}
            </AppText>
            <AppText variant="caption" className="text-grafite-suave">
              {t('exams.home.introConsent')}
            </AppText>
            <PrimaryButton
              label={t('exams.home.authorize')}
              onPress={() => router.push('/exam/consent')}
              isLoading={false}
            />
          </View>
        ) : (
          <PrimaryButton
            label={t('exams.home.send')}
            hint={t('exams.home.sendHint')}
            onPress={() => router.push('/exam/upload')}
            isLoading={false}
          />
        )}

        {waitingReview.length > 0 ? (
          <Section title={t('exams.home.waiting')}>
            {waitingReview.map((document) => (
              <ListRow
                key={document.id}
                title={EXAM_TYPE_LABELS[document.examType]}
                description={`${formatExamDate(document.collectedAt)} · ${STATUS_LABELS[document.status]}`}
                onPress={() =>
                  router.push({ pathname: '/exam/review/[id]', params: { id: document.id } })
                }
              />
            ))}
          </Section>
        ) : null}

        <Section title={t('exams.home.blood')}>
          {bloodPanels.length === 0 ? (
            <AppText className="py-3 text-grafite-suave">{t('exams.home.noBlood')}</AppText>
          ) : (
            bloodPanels.map((document) => (
              <ListRow
                key={document.id}
                title={formatExamDate(document.collectedAt ?? document.uploadedAt)}
                description={[document.labName, STATUS_LABELS[document.status]]
                  .filter(Boolean)
                  .join(' · ')}
                onPress={() =>
                  router.push(
                    document.status === 'extracted'
                      ? { pathname: '/exam/review/[id]', params: { id: document.id } }
                      : { pathname: '/exam/[id]', params: { id: document.id } },
                  )
                }
              />
            ))
          )}
        </Section>

        <Section title={t('exams.home.more')}>
          <ListRow
            title={t('exams.home.indices')}
            description={t('exams.home.indicesHint')}
            onPress={() => router.push('/exam/indices')}
          />
          <ListRow
            title={t('exams.home.bio')}
            description={t('exams.home.bioHint')}
            onPress={() => router.push('/exam/bioimpedance')}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExamsComingSoon() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          {t('exams.title')}
        </AppText>
        <View className="gap-2 rounded-2xl bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            {t('exams.home.soon')}
          </AppText>
          <AppText className="text-grafite">
            {t('exams.home.soonText')}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-1">
      <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
        {title}
      </AppText>
      <View className="rounded-2xl bg-superficie px-4">{children}</View>
    </View>
  );
}
