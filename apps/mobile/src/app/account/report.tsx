import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usersControllerGetProgressReport } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { PrimaryButton } from '@/features/auth/primary-button';
import { buildProgressReport } from '@/features/report/progress-report';
import { renderReportHtml } from '@/features/report/report-html';
import { shareReport } from '@/features/report/share-report';

const INCLUDED = ['weight', 'weeks', 'goals', 'diary'] as const;

/**
 * Relatório de progresso em PDF, feito para ler, imprimir ou mostrar a um
 * profissional. Diferente da exportação (JSON, para outros apps).
 */
export default function ProgressReportScreen() {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  useAnnounce(done);

  async function handleGenerate() {
    setError(null);
    setDone(null);
    setIsGenerating(true);
    try {
      const data = await usersControllerGetProgressReport();
      await shareReport(renderReportHtml(buildProgressReport(data)), t('account.report.shareTitle'));
      setDone(t('account.report.done'));
    } catch {
      setError(t('account.report.error'));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        {t('account.report.intro')}
      </AppText>

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          {t('account.report.shows')}
        </AppText>
        {INCLUDED.map((item) => (
          <AppText key={item} className="text-grafite">
            • {t(`account.report.items.${item}`)}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        {t('account.report.privacy')}
      </AppText>

      {done ? (
        <AppText variant="bodyStrong" className="text-grafite">
          ✓ {done}
        </AppText>
      ) : null}
      <FormError message={error} />

      <PrimaryButton
        label={isGenerating ? t('account.report.generating') : t('account.report.generate')}
        onPress={() => void handleGenerate()}
        isLoading={isGenerating}
      />
    </ScrollView>
  );
}
