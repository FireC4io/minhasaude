import { CURRENT_PRIVACY_POLICY_VERSION, PRIVACY_POLICY_URL } from '@minhasaude/shared';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

/** Resumo da política com link para o texto completo — mesmo conteúdo no onboarding e no reaceite. */
export function PrivacySummaryCard() {
  const { t } = useTranslation();
  return (
    <View className="gap-3 rounded-2xl border border-grafite bg-superficie p-4">
      <AppText className="text-grafite">{t('onboarding.consentUse')}</AppText>
      <AppText className="text-grafite">{t('onboarding.consentNoSale')}</AppText>
      <AppText className="text-grafite">{t('onboarding.consentRights')}</AppText>
      <AppText className="text-grafite">
        {t('onboarding.consentVersion', { version: CURRENT_PRIVACY_POLICY_VERSION })}
      </AppText>
      <TextButton
        label={t('onboarding.readFullPolicy')}
        onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
        className="self-start"
      />
    </View>
  );
}
