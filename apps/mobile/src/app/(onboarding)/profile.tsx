import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useUsersControllerUpdateProfile } from '@/api/generated/endpoints/me/me';
import type { UpdateProfileDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { SteppedProfileForm } from '@/features/profile/stepped-profile-form';

export default function OnboardingProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const updateProfile = useUsersControllerUpdateProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(data: UpdateProfileDto) {
    setSubmitError(null);
    try {
      await updateProfile.mutateAsync({ data });
      router.push('/weight');
    } catch (err) {
      setSubmitError(
        isAxiosError(err) && err.response?.status === 403
          ? t('onboarding.profileForbidden')
          : t('onboarding.profileError'),
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="gap-1">
            <AppText variant="title" accessibilityRole="header" className="text-grafite">
              {t('onboarding.profileTitle')}
            </AppText>
            <AppText className="text-grafite">
              {t('onboarding.profileIntro')}
            </AppText>
          </View>

          <SteppedProfileForm
            isSubmitting={updateProfile.isPending}
            submitError={submitError}
            onSubmit={(data) => void handleSubmit(data)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
