import {
  ACTIVITY_LEVELS,
  GOALS,
  SEXES,
  profileFormSchema,
  type Goal,
  type Sex,
} from '@minhasaude/shared';
import { useState } from 'react';
import { View } from 'react-native';

import type { UpdateProfileDto } from '@/api/generated/models';
import { FormError } from '@/components/ui/form-error';
import { RadioList } from '@/components/ui/radio-list';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { brDateToIso, isoToBrDate, maskBrDate } from '@/features/forms/br-date';
import { parseDecimal } from '@/features/forms/parse-decimal';
import { GOAL_LABELS, SEX_LABELS } from '@/features/onboarding/enum-labels';
import { SelectChips } from '@/features/onboarding/select-chips';

import { ACTIVITY_OPTIONS } from './activity-options';

type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export interface ProfileFormInitial {
  birthDate?: string | null;
  sex?: Sex | null;
  heightCm?: string | number | null;
  activityLevel?: ActivityLevel | null;
  goal?: Goal | null;
}

interface ProfileFormProps {
  initial?: ProfileFormInitial;
  submitLabel: string;
  isSubmitting: boolean;
  /** Erro vindo do servidor; os de validação o formulário mostra sozinho. */
  submitError?: string | null;
  onSubmit: (data: UpdateProfileDto) => void;
}

/** Perfil usado no onboarding e na edição pelo Perfil. */
export function ProfileForm({
  initial,
  submitLabel,
  isSubmitting,
  submitError,
  onSubmit,
}: ProfileFormProps) {
  const [birthDate, setBirthDate] = useState(isoToBrDate(initial?.birthDate));
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm ? String(Math.round(Number(initial.heightCm))) : '',
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    initial?.activityLevel ?? null,
  );
  const [goal, setGoal] = useState<Goal | null>(initial?.goal ?? null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);

    const isoBirthDate = brDateToIso(birthDate);
    if (!isoBirthDate) {
      setError('Confira a data de nascimento: use dia, mês e ano, como 20/05/1996.');
      return;
    }

    const parsed = profileFormSchema.safeParse({
      birthDate: isoBirthDate,
      sex,
      heightCm: parseDecimal(heightCm),
      activityLevel,
      goal,
    });
    if (!parsed.success) {
      setError(
        'Falta alguma informação. Confira a altura (em centímetros, ex.: 165) e se escolheu sexo, atividade e objetivo.',
      );
      return;
    }

    onSubmit(parsed.data);
  }

  return (
    <View className="gap-5">
      <AuthTextField
        testID="profile-birth-date"
        label="Data de nascimento"
        value={birthDate}
        onChangeText={(text) => setBirthDate(maskBrDate(text))}
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        maxLength={10}
        accessibilityHint="Digite dia, mês e ano. As barras entram sozinhas."
      />
      <AuthTextField
        testID="profile-height-cm"
        label="Altura (cm)"
        value={heightCm}
        onChangeText={setHeightCm}
        placeholder="ex.: 165"
        keyboardType="number-pad"
        maxLength={3}
      />
      <SelectChips label="Sexo" options={SEXES} optionLabels={SEX_LABELS} value={sex} onChange={setSex} />
      <RadioList
        label="Como é a sua rotina?"
        options={ACTIVITY_OPTIONS}
        value={activityLevel}
        onChange={setActivityLevel}
      />
      <SelectChips label="Objetivo" options={GOALS} optionLabels={GOAL_LABELS} value={goal} onChange={setGoal} />

      <FormError message={error ?? submitError} />

      <PrimaryButton label={submitLabel} onPress={handleSubmit} isLoading={isSubmitting} />
    </View>
  );
}
