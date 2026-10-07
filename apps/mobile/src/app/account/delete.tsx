import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useUsersControllerRequestDeletion } from '@/api/generated/endpoints/me/me';
import type { DeletionStatus } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { useAuth } from '@/features/auth/auth-context';
import { PrimaryButton } from '@/features/auth/primary-button';
import { TextButton } from '@/components/ui/text-button';

const WHAT_IS_DELETED = ['account', 'diary', 'goals', 'foods'] as const;

/**
 * Direito de eliminação (LGPD, art. 18). Informativo, sem tom alarmista, e com
 * confirmação explícita. A exclusão é imediata e sem volta (decisão de
 * 2026-10-07), então a tela oferece guardar os dados antes.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const requestDeletion = useUsersControllerRequestDeletion();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeletionStatus | null>(null);
  useAnnounce(result ? t('account.delete.doneAnnounce') : null);

  async function handleDelete() {
    setError(null);
    try {
      const response = await requestDeletion.mutateAsync();
      setResult(response.status);
    } catch {
      setError(t('account.delete.error'));
    }
  }

  if (result) {
    return (
      <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          {t('account.delete.doneTitle')}
        </AppText>
        <AppText className="text-grafite">
          {result === 'deleted' ? t('account.delete.doneDeleted') : t('account.delete.donePending')}
        </AppText>
        <PrimaryButton label={t('common.close')} onPress={() => void logout()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        {t('account.delete.intro')}
      </AppText>

      <View className="gap-1">
        <TextButton
          label={t('account.delete.downloadReport')}
          onPress={() => router.push('/account/report')}
        />
        <TextButton
          label={t('account.delete.downloadAll')}
          onPress={() => router.push('/account/export')}
        />
      </View>

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          {t('account.delete.willDelete')}
        </AppText>
        {WHAT_IS_DELETED.map((item) => (
          <AppText key={item} className="text-grafite">
            • {t(`account.delete.items.${item}`)}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        {t('account.delete.kept')}
      </AppText>

      <CheckboxRow
        label={t('account.delete.confirm')}
        checked={confirmed}
        onChange={setConfirmed}
      />

      <FormError message={error} />

      <PrimaryButton
        label={t('account.delete.button')}
        tone="danger"
        disabled={!confirmed}
        hint={confirmed ? undefined : t('account.delete.buttonHint')}
        isLoading={requestDeletion.isPending}
        onPress={() => void handleDelete()}
      />
    </ScrollView>
  );
}
