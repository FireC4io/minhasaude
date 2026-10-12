import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useConsentsControllerList } from '@/api/generated/endpoints/consents/consents';
import { AppText } from '@/components/ui/app-text';
import { CONSENT_LABELS, formatConsentDate } from '@/features/account/consent-labels';
import { QueryStateView } from '@/features/network/query-state-view';
import { queryView } from '@/features/network/query-view';
import type { ConsentStatusResponseDto } from '@/api/generated/models';
import type { TFunction } from 'i18next';

/** Aceito (com a versão da política, se houver), retirado ou ainda não dado. */
function describeConsent(consent: ConsentStatusResponseDto, t: TFunction): string {
  if (!consent.granted) {
    return consent.revokedAt
      ? t('account.privacy.revoked', { date: formatConsentDate(consent.revokedAt) })
      : t('account.privacy.notYet');
  }
  const date = formatConsentDate(consent.grantedAt);
  return consent.policyVersion
    ? t('account.privacy.acceptedVersion', { date, version: consent.policyVersion })
    : t('account.privacy.accepted', { date });
}

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const consentsQuery = useConsentsControllerList();
  const consents = consentsQuery.data ?? [];

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        {t('account.privacy.intro')}
      </AppText>

      <QueryStateView
        view={queryView(consentsQuery)}
        loadingLabel={t('account.privacy.loading')}
        errorMessage={t('account.privacy.loadError')}>
        {() => (
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
                    {describeConsent(consent, t)}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}
      </QueryStateView>

      <AppText variant="caption" className="text-grafite-suave">
        {t('account.privacy.rights')}
      </AppText>
    </ScrollView>
  );
}
