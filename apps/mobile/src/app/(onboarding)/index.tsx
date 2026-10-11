import { CURRENT_PRIVACY_POLICY_VERSION } from '@minhasaude/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useConsentsControllerGrant } from '@/api/generated/endpoints/consents/consents';
import { FormError } from '@/components/ui/form-error';
import { PrimaryButton } from '@/features/auth/primary-button';
import { AppText } from '@/components/ui/app-text';
import { PrivacySummaryCard } from '@/features/onboarding/privacy-summary-card';

export default function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const grantConsent = useConsentsControllerGrant();
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    try {
      await grantConsent.mutateAsync({
        data: { consentType: 'privacy_policy', policyVersion: CURRENT_PRIVACY_POLICY_VERSION },
      });
      router.push('/profile');
    } catch {
      setError(t('onboarding.acceptError'));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8" className="flex-1">
        <View className="gap-1">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">{t('onboarding.consentTitle')}</AppText>
          <AppText className="text-grafite">
            {t('onboarding.consentIntro')}
          </AppText>
        </View>

        <PrivacySummaryCard />

        <FormError message={error} />

        <PrimaryButton
          label={t('onboarding.accept')}
          onPress={handleAccept}
          isLoading={grantConsent.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
