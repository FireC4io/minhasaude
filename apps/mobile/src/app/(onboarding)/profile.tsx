import { ACTIVITY_LEVELS, GOALS, SEXES, profileFormSchema, type Goal, type Sex } from '@minhasaude/shared';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsersControllerUpdateProfile } from '@/api/generated/endpoints/me/me';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { ACTIVITY_LEVEL_LABELS, GOAL_LABELS, SEX_LABELS } from '@/features/onboarding/enum-labels';
import { SelectChips } from '@/features/onboarding/select-chips';

export default function ProfileScreen() {
  const router = useRouter();
  const updateProfile = useUsersControllerUpdateProfile();

  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<(typeof ACTIVITY_LEVELS)[number] | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    const parsed = profileFormSchema.safeParse({
      birthDate,
      sex,
      heightCm: Number(heightCm),
      activityLevel,
      goal,
    });

    if (!parsed.success) {
      setError('Preencha todos os campos corretamente antes de continuar.');
      return;
    }

    try {
      await updateProfile.mutateAsync({ data: parsed.data });
      router.push('/weight');
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 403
          ? 'Sessão sem consentimento ativo. Volte e aceite a política de privacidade.'
          : 'Não foi possível salvar seu perfil. Tente de novo.',
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 gap-6 px-6 pt-8">
        <View className="gap-1">
          <Text className="text-3xl font-semibold text-grafite">Seu perfil</Text>
          <Text className="text-base text-grafite">
            Usamos isso pra calcular sua meta calórica e de macronutrientes.
          </Text>
        </View>

        <View className="gap-4">
          <AuthTextField
            testID="onboarding-birth-date"
            label="Data de nascimento (AAAA-MM-DD)"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="1996-05-20"
            keyboardType="numbers-and-punctuation"
          />
          <AuthTextField
            testID="onboarding-height-cm"
            label="Altura (cm)"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="165"
            keyboardType="numeric"
          />
          <SelectChips
            label="Sexo"
            options={SEXES}
            optionLabels={SEX_LABELS}
            value={sex}
            onChange={setSex}
          />
          <SelectChips
            label="Nível de atividade"
            options={ACTIVITY_LEVELS}
            optionLabels={ACTIVITY_LEVEL_LABELS}
            value={activityLevel}
            onChange={setActivityLevel}
          />
          <SelectChips label="Objetivo" options={GOALS} optionLabels={GOAL_LABELS} value={goal} onChange={setGoal} />

          {error ? <Text className="text-sm text-jabuticaba">{error}</Text> : null}

          <PrimaryButton label="Continuar" onPress={handleSubmit} isLoading={updateProfile.isPending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
