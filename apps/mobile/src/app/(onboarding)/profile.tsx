import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsersControllerUpdateProfile } from '@/api/generated/endpoints/me/me';
import type { UpdateProfileDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { SteppedProfileForm } from '@/features/profile/stepped-profile-form';

export default function OnboardingProfileScreen() {
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
          ? 'Falta aceitar a política de privacidade. Volte uma tela e aceite para continuar.'
          : 'Não foi possível salvar seu perfil. Confira sua internet e tente de novo.',
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
              Seu perfil
            </AppText>
            <AppText className="text-grafite">
              Usamos estas informações para calcular sua meta diária de calorias e nutrientes.
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
