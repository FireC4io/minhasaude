import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import {
  getGoalsControllerGetCurrentQueryKey,
  useGoalsControllerGetCurrent,
  useGoalsControllerRecalculate,
} from '@/api/generated/endpoints/goals/goals';
import {
  getUsersControllerGetMeQueryKey,
  useUsersControllerGetMe,
  useUsersControllerUpdateProfile,
} from '@/api/generated/endpoints/me/me';
import { useTranslation } from 'react-i18next';
import type { UpdateProfileDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { GoalCard } from '@/features/profile/goal-card';
import { ProfileForm } from '@/features/profile/profile-form';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const meQuery = useUsersControllerGetMe();
  const goalQuery = useGoalsControllerGetCurrent();
  const updateProfile = useUsersControllerUpdateProfile();
  const recalculate = useGoalsControllerRecalculate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  useAnnounce(savedMessage);

  async function handleSubmit(data: UpdateProfileDto) {
    setSubmitError(null);
    setSavedMessage(null);
    try {
      await updateProfile.mutateAsync({ data });
      // A meta depende do perfil: sem recalcular, ela ficaria desatualizada.
      await recalculate.mutateAsync({ data: {} });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getUsersControllerGetMeQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGoalsControllerGetCurrentQueryKey() }),
      ]);
      setSavedMessage(t('account.edit.saved'));
    } catch {
      setSubmitError(t('account.edit.saveError'));
    }
  }

  const profile = meQuery.data?.profile;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-6" keyboardShouldPersistTaps="handled">
        {goalQuery.data ? <GoalCard goal={goalQuery.data} /> : null}

        {savedMessage ? (
          <View className="rounded-2xl bg-superficie p-4">
            <AppText variant="bodyStrong" className="text-grafite">
              ✓ {savedMessage}
            </AppText>
          </View>
        ) : null}

        {meQuery.isPending ? (
          <LoadingIndicator label={t('account.edit.loading')} />
        ) : meQuery.isError ? (
          <FormError message={t('account.edit.loadError')} />
        ) : (
          <ProfileForm
            initial={{
              birthDate: profile?.birthDate,
              sex: profile?.sex,
              heightCm: profile?.heightCm,
              activityLevel: profile?.activityLevel,
              goal: profile?.goal,
              weeklyPaceKg: profile?.weeklyPaceKg,
            }}
            submitLabel={t('account.edit.submit')}
            isSubmitting={updateProfile.isPending || recalculate.isPending}
            submitError={submitError}
            onSubmit={(data) => void handleSubmit(data)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
