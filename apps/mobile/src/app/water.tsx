import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { ModalHeader } from '@/components/ui/modal-header';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { todayIsoDate } from '@/features/diary/date-utils';
import { usePreviewValue } from '@/features/preview/preview-store';
import { DEFAULT_WATER_GOAL_ML, formatMl } from '@/features/water/water-math';
import { WaterCard } from '@/features/water/water-card';

const parseMl = (text: string): number | null => {
  const value = Number(text.replace(/\D/g, ''));
  return Number.isFinite(value) && value > 0 && value <= 5000 ? value : null;
};

/** Água: valor livre e meta ajustável (F4-35). Prévia — sem API ainda. */
export default function WaterScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayIsoDate();
  const [totalMl, setTotalMl] = usePreviewValue(`water:${date}`, 0);
  const [goalMl, setGoalMl] = usePreviewValue('water:goal', DEFAULT_WATER_GOAL_ML);
  const [amount, setAmount] = useState('');
  const [goalText, setGoalText] = useState(String(goalMl));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useAnnounce(message);

  function addCustom() {
    setError(null);
    const ml = parseMl(amount);
    if (!ml) {
      setError(t('water.amountError'));
      return;
    }
    setTotalMl(totalMl + ml);
    setAmount('');
    setMessage(t('water.added', { amount: formatMl(ml) }));
  }

  function saveGoal() {
    setError(null);
    const ml = parseMl(goalText);
    if (!ml) {
      setError(t('water.goalError'));
      return;
    }
    setGoalMl(ml);
    setMessage(t('water.goalSaved', { amount: formatMl(ml) }));
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-6 py-6" keyboardShouldPersistTaps="handled">
          <ModalHeader title={t('water.title')} />
          <PreviewBanner missing={t('water.preview')} />

          <WaterCard date={date} onOpenDetails={() => undefined} />

          <View className="gap-3">
            <AuthTextField
              label={t('water.otherAmount')}
              value={amount}
              onChangeText={setAmount}
              placeholder={t('misc.waterPlaceholder')}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={addCustom}
            />
            <PrimaryButton label={t('water.log')} onPress={addCustom} isLoading={false} />
          </View>

          <View className="gap-3">
            <AuthTextField
              label={t('water.goal')}
              value={goalText}
              onChangeText={setGoalText}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={saveGoal}
            />
            <AppText variant="caption" className="text-grafite-suave">
              {t('water.goalHint')}
            </AppText>
            <PrimaryButton label={t('water.saveGoal')} onPress={saveGoal} isLoading={false} />
          </View>

          <FormError message={error} />
          {message ? (
            <AppText variant="bodyStrong" className="text-grafite">
              ✓ {message}
            </AppText>
          ) : null}
          {totalMl > 0 ? (
            <AppText variant="caption" className="text-grafite-suave">
              Total de hoje: {formatMl(totalMl)}
            </AppText>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
