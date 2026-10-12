import { useTranslation } from 'react-i18next';

import { usersControllerGetProgressReport } from '@/api/generated/endpoints/me/me';
import { FileActionScreen } from '@/features/account/file-action-screen';
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

  async function generateReport() {
    const data = await usersControllerGetProgressReport();
    await shareReport(renderReportHtml(buildProgressReport(data)), t('account.report.shareTitle'));
  }

  return (
    <FileActionScreen
      run={generateReport}
      texts={{
        intro: t('account.report.intro'),
        listTitle: t('account.report.shows'),
        items: INCLUDED.map((item) => t(`account.report.items.${item}`)),
        note: t('account.report.privacy'),
        generate: t('account.report.generate'),
        generating: t('account.report.generating'),
        done: t('account.report.done'),
        error: t('account.report.error'),
      }}
    />
  );
}
