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
import { useTranslation } from 'react-i18next';

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
import { WeeklyPacePicker } from './weekly-pace-picker';
import {
  DEFAULT_PACE_OPTION,
  paceKgToOption,
  paceOptionToKg,
  type PaceOption,
} from './weekly-pace';

type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export interface ProfileFormInitial {
  birthDate?: string | null;
  sex?: Sex | null;
  heightCm?: string | number | null;
  activityLevel?: ActivityLevel | null;
  goal?: Goal | null;
  weeklyPaceKg?: string | null;
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
  const { t } = useTranslation();
  const [birthDate, setBirthDate] = useState(isoToBrDate(initial?.birthDate));
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm ? String(Math.round(Number(initial.heightCm))) : '',
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    initial?.activityLevel ?? null,
  );
  const [goal, setGoal] = useState<Goal | null>(initial?.goal ?? null);
  const [pace, setPace] = useState<PaceOption | null>(
    paceKgToOption(initial?.weeklyPaceKg) ??
      (initial?.goal && initial.goal !== 'maintain' ? DEFAULT_PACE_OPTION : null),
  );

  function chooseGoal(value: Goal) {
    setGoal(value);
    setPace(value === 'maintain' ? null : (pace ?? DEFAULT_PACE_OPTION));
  }
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);

    const isoBirthDate = brDateToIso(birthDate);
    if (!isoBirthDate) {
      setError(t('profileForm.birthDateError'));
      return;
    }

    const parsed = profileFormSchema.safeParse({
      birthDate: isoBirthDate,
      sex,
      heightCm: parseDecimal(heightCm),
      activityLevel,
      goal,
      weeklyPaceKg: goal === 'maintain' || !pace ? null : paceOptionToKg(pace),
    });
    if (!parsed.success) {
      setError(t('profileForm.incomplete'));
      return;
    }

    onSubmit(parsed.data);
  }

  return (
    <View className="gap-5">
      <AuthTextField
        testID="profile-birth-date"
        label={t('profileForm.birthDate')}
        value={birthDate}
        onChangeText={(text) => setBirthDate(maskBrDate(text))}
        placeholder={t('profileForm.birthDatePlaceholder')}
        keyboardType="number-pad"
        maxLength={10}
        accessibilityHint={t('profileForm.birthDateHint')}
      />
      <AuthTextField
        testID="profile-height-cm"
        label={t('profileForm.height')}
        value={heightCm}
        onChangeText={setHeightCm}
        placeholder={t('profileForm.heightPlaceholder')}
        keyboardType="number-pad"
        maxLength={3}
      />
      <SelectChips label={t('profileForm.sex')} options={SEXES} optionLabels={SEX_LABELS} value={sex} onChange={setSex} />
      <RadioList
        label={t('profileForm.routine')}
        options={ACTIVITY_OPTIONS}
        value={activityLevel}
        onChange={setActivityLevel}
      />
      <SelectChips label={t('profileForm.goal')} options={GOALS} optionLabels={GOAL_LABELS} value={goal} onChange={chooseGoal} />
      <WeeklyPacePicker goal={goal} value={pace} onChange={setPace} />

      <FormError message={error ?? submitError} />

      <PrimaryButton label={submitLabel} onPress={handleSubmit} isLoading={isSubmitting} />
    </View>
  );
}
