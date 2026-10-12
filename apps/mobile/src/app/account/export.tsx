import { useTranslation } from 'react-i18next';

import { usersControllerExportData } from '@/api/generated/endpoints/me/me';
import { exportFileName } from '@/features/account/export-file-name';
import { FileActionScreen } from '@/features/account/file-action-screen';
import { saveExportFile } from '@/features/account/save-export-file';

const INCLUDED = ['account', 'profile', 'consents', 'goals', 'weights', 'diary'] as const;

/** Direito de portabilidade (LGPD, art. 18). Gratuito e sem limite. */
export default function ExportDataScreen() {
  const { t } = useTranslation();

  async function exportData() {
    const data: unknown = await usersControllerExportData();
    await saveExportFile(exportFileName(), JSON.stringify(data, null, 2), t('account.export.shareTitle'));
  }

  return (
    <FileActionScreen
      run={exportData}
      texts={{
        intro: t('account.export.intro'),
        listTitle: t('account.export.includes'),
        items: INCLUDED.map((item) => t(`account.export.items.${item}`)),
        note: t('account.export.format'),
        generate: t('account.export.generate'),
        generating: t('account.export.generating'),
        done: t('account.export.done'),
        error: t('account.export.error'),
      }}
    />
  );
}
