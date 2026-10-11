import { CURRENT_PRIVACY_POLICY_VERSION } from '@minhasaude/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  getConsentsControllerListQueryKey,
  useConsentsControllerGrant,
} from '@/api/generated/endpoints/consents/consents';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { TextButton } from '@/components/ui/text-button';
import { useAuth } from '@/features/auth/auth-context';
import { PrimaryButton } from '@/features/auth/primary-button';
import { PrivacySummaryCard } from '@/features/onboarding/privacy-summary-card';

/**
 * A política mudou desde o último aceite (seção 10 dela): a pessoa aceita a
 * versão nova antes de seguir. Quem não quiser aceitar ainda pode baixar os
 * dados, apagar a conta ou sair — nada disso exige o consentimento.
 */
export default function PolicyUpdateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const grantConsent = useConsentsControllerGrant();
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    try {
      await grantConsent.mutateAsync({
        data: { consentType: 'privacy_policy', policyVersion: CURRENT_PRIVACY_POLICY_VERSION },
      });
      // A raiz relê os consentimentos e abre o app.
      await queryClient.invalidateQueries({ queryKey: getConsentsControllerListQueryKey() });
    } catch {
      setError(t('onboarding.acceptError'));
    }
  }

  const link = (label: string, onPress: () => void) => (
    <TextButton label={label} onPress={onPress} textVariant="bodyStrong" textClassName="text-mamao-forte" />
  );

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8" className="flex-1">
        <View className="gap-1">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">
            {t('policyUpdate.title')}
          </AppText>
          <AppText className="text-grafite">
            {t('policyUpdate.intro', { version: CURRENT_PRIVACY_POLICY_VERSION })}
          </AppText>
        </View>

        <PrivacySummaryCard />

        <FormError message={error} />
        <PrimaryButton
          label={t('policyUpdate.accept')}
          onPress={() => void handleAccept()}
          isLoading={grantConsent.isPending}
        />

        <View className="items-center gap-2">
          <AppText className="text-center text-grafite-suave">{t('policyUpdate.declineIntro')}</AppText>
          {link(t('policyUpdate.export'), () => router.push('/account/export'))}
          {link(t('policyUpdate.delete'), () => router.push('/account/delete'))}
          {link(t('policyUpdate.logout'), () => void logout())}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
