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
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { RadioList } from '@/components/ui/radio-list';
import { TextButton } from '@/components/ui/text-button';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { brDateToIso, maskBrDate } from '@/features/forms/br-date';
import { parseDecimal } from '@/features/forms/parse-decimal';
import { GOAL_LABELS, SEX_LABELS } from '@/features/onboarding/enum-labels';
import { SelectChips } from '@/features/onboarding/select-chips';

import { ACTIVITY_OPTIONS } from './activity-options';
import { WeeklyPacePicker } from './weekly-pace-picker';
import { DEFAULT_PACE_OPTION, paceOptionToKg, type PaceOption } from './weekly-pace';

type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

const STEP_TITLES = ['Sobre você', 'Seu corpo', 'Sua rotina', 'Seu objetivo'] as const;
const TOTAL = STEP_TITLES.length;

interface SteppedProfileFormProps {
  isSubmitting: boolean;
  submitError?: string | null;
  onSubmit: (data: UpdateProfileDto) => void;
}

/**
 * Perfil do onboarding em passos curtos (F4-31): um assunto por tela é mais
 * fácil para quem tem pouca familiaridade com apps. A edição pelo Perfil
 * continua numa tela só (`ProfileForm`) — quem edita já conhece os campos.
 */
export function SteppedProfileForm({
  isSubmitting,
  submitError,
  onSubmit,
}: SteppedProfileFormProps) {
  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [pace, setPace] = useState<PaceOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  useAnnounce(`Passo ${step + 1} de ${TOTAL}: ${STEP_TITLES[step]}`);

  function stepError(): string | null {
    if (step === 0) {
      if (!brDateToIso(birthDate))
        return 'Confira a data de nascimento: dia, mês e ano, como 20/05/1996.';
      const height = parseDecimal(heightCm);
      if (!(height >= 50 && height <= 272))
        return 'Digite a altura em centímetros, por exemplo 165.';
    }
    if (step === 1 && !sex) return 'Escolha uma das opções para continuar.';
    if (step === 2 && !activityLevel) return 'Escolha a opção mais parecida com a sua rotina.';
    if (step === 3 && !goal) return 'Escolha o seu objetivo.';
    return null;
  }

  function next() {
    const problem = stepError();
    setError(problem);
    if (problem) return;
    if (step < TOTAL - 1) {
      setStep(step + 1);
      return;
    }
    const parsed = profileFormSchema.safeParse({
      birthDate: brDateToIso(birthDate),
      sex,
      heightCm: parseDecimal(heightCm),
      activityLevel,
      goal,
      weeklyPaceKg: goal === 'maintain' || !pace ? null : paceOptionToKg(pace),
    });
    if (parsed.success) onSubmit(parsed.data);
    else setError('Alguma informação ficou incompleta. Volte e confira os passos.');
  }

  // Ao escolher perder/ganhar, a opção mais leve já vem marcada.
  function chooseGoal(value: Goal) {
    setGoal(value);
    setPace(value === 'maintain' ? null : (pace ?? DEFAULT_PACE_OPTION));
  }

  function back() {
    setError(null);
    setStep(Math.max(0, step - 1));
  }

  return (
    <View className="gap-5">
      <View className="gap-2">
        <AppText variant="label" className="text-grafite-suave">
          Passo {step + 1} de {TOTAL}
        </AppText>
        <View className="h-2 overflow-hidden rounded-full bg-linha" importantForAccessibility="no">
          <View
            className="h-2 rounded-full bg-mamao-forte"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </View>
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          {STEP_TITLES[step]}
        </AppText>
      </View>

      {step === 0 ? (
        <>
          <AuthTextField
            label="Data de nascimento"
            value={birthDate}
            onChangeText={(text) => setBirthDate(maskBrDate(text))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
          />
          <AuthTextField
            label="Altura (cm)"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="ex.: 165"
            keyboardType="number-pad"
            maxLength={3}
          />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <SelectChips
            label="Sexo"
            options={SEXES}
            optionLabels={SEX_LABELS}
            value={sex}
            onChange={setSex}
          />
          <AppText variant="caption" className="text-grafite-suave">
            Usado só na fórmula de gasto de energia, que é diferente para cada sexo biológico.
          </AppText>
        </>
      ) : null}
      {step === 2 ? (
        <RadioList
          label="Como é a sua rotina?"
          options={ACTIVITY_OPTIONS}
          value={activityLevel}
          onChange={setActivityLevel}
        />
      ) : null}
      {step === 3 ? (
        <>
          <SelectChips
            label="Objetivo"
            options={GOALS}
            optionLabels={GOAL_LABELS}
            value={goal}
            onChange={chooseGoal}
          />
          <WeeklyPacePicker goal={goal} value={pace} onChange={setPace} />
        </>
      ) : null}

      <FormError message={error ?? submitError} />
      <PrimaryButton
        label={step === TOTAL - 1 ? 'Calcular minha meta' : 'Continuar'}
        onPress={next}
        isLoading={isSubmitting}
      />
      {step > 0 ? (
        <TextButton
          label="Voltar"
          onPress={back}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
          className="items-center"
        />
      ) : null}
    </View>
  );
}
