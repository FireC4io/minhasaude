import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usersControllerExportData } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { exportFileName } from '@/features/account/export-file-name';
import { saveExportFile } from '@/features/account/save-export-file';
import { PrimaryButton } from '@/features/auth/primary-button';

const INCLUDED = ['account', 'profile', 'consents', 'goals', 'weights', 'diary'] as const;

/** Direito de portabilidade (LGPD, art. 18). Gratuito e sem limite. */
export default function ExportDataScreen() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  useAnnounce(done);

  async function handleExport() {
    setError(null);
    setDone(null);
    setIsExporting(true);
    try {
      const data: unknown = await usersControllerExportData();
      await saveExportFile(exportFileName(), JSON.stringify(data, null, 2), t('account.export.shareTitle'));
      setDone(t('account.export.done'));
    } catch {
      setError(t('account.export.error'));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        {t('account.export.intro')}
      </AppText>

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          {t('account.export.includes')}
        </AppText>
        {INCLUDED.map((item) => (
          <AppText key={item} className="text-grafite">
            • {t(`account.export.items.${item}`)}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        {t('account.export.format')}
      </AppText>

      {done ? (
        <AppText variant="bodyStrong" className="text-grafite">
          ✓ {done}
        </AppText>
      ) : null}
      <FormError message={error} />

      <PrimaryButton
        label={isExporting ? t('account.export.generating') : t('account.export.generate')}
        onPress={() => void handleExport()}
        isLoading={isExporting}
      />
    </ScrollView>
  );
}
