import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useConsentsControllerList } from '@/api/generated/endpoints/consents/consents';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import {
  CONSENT_LABELS,
  formatConsentDate,
  type ConsentStatusView,
} from '@/features/account/consent-labels';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const consentsQuery = useConsentsControllerList();
  const consents = (consentsQuery.data ?? []) as unknown as ConsentStatusView[];

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        {t('account.privacy.intro')}
      </AppText>

      {consentsQuery.isPending ? (
        <LoadingIndicator label={t('account.privacy.loading')} />
      ) : consentsQuery.isError ? (
        <FormError message={t('account.privacy.loadError')} />
      ) : (
        <View className="gap-3">
          {consents.map((consent) => {
            const label = CONSENT_LABELS[consent.consentType];
            return (
              <View key={consent.consentType} className="gap-1 rounded-2xl bg-superficie p-4">
                <AppText variant="bodyStrong" className="text-grafite">
                  {label.title}
                </AppText>
                <AppText variant="caption" className="text-grafite">
                  {label.what}
                </AppText>
                <AppText variant="label" className="text-grafite">
                  {consent.granted
                    ? consent.policyVersion
                      ? t('account.privacy.acceptedVersion', {
                          date: formatConsentDate(consent.grantedAt),
                          version: consent.policyVersion,
                        })
                      : t('account.privacy.accepted', { date: formatConsentDate(consent.grantedAt) })
                    : consent.revokedAt
                      ? t('account.privacy.revoked', { date: formatConsentDate(consent.revokedAt) })
                      : t('account.privacy.notYet')}
                </AppText>
              </View>
            );
          })}
        </View>
      )}

      <AppText variant="caption" className="text-grafite-suave">
        {t('account.privacy.rights')}
      </AppText>
    </ScrollView>
  );
}
