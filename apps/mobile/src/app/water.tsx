import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      setError('Digite a quantidade em mililitros, por exemplo 300.');
      return;
    }
    setTotalMl(totalMl + ml);
    setAmount('');
    setMessage(`${formatMl(ml)} registrados.`);
  }

  function saveGoal() {
    setError(null);
    const ml = parseMl(goalText);
    if (!ml) {
      setError('Digite a meta em mililitros, por exemplo 2000.');
      return;
    }
    setGoalMl(ml);
    setMessage(`Meta de água ajustada para ${formatMl(ml)}.`);
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-6 py-6" keyboardShouldPersistTaps="handled">
          <ModalHeader title="Água" />
          <PreviewBanner missing="Ainda não há onde guardar a água no servidor: o que você registrar aqui some ao fechar o app." />

          <WaterCard date={date} onOpenDetails={() => undefined} />

          <View className="gap-3">
            <AuthTextField
              label="Outra quantidade (ml)"
              value={amount}
              onChangeText={setAmount}
              placeholder="ex.: 300"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={addCustom}
            />
            <PrimaryButton label="Registrar" onPress={addCustom} isLoading={false} />
          </View>

          <View className="gap-3">
            <AuthTextField
              label="Sua meta diária (ml)"
              value={goalText}
              onChangeText={setGoalText}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={saveGoal}
            />
            <AppText variant="caption" className="text-grafite-suave">
              Você escolhe a meta. O app não calcula quanto você deve beber: se tiver dúvida, converse
              com um profissional de saúde.
            </AppText>
            <PrimaryButton label="Salvar meta" onPress={saveGoal} isLoading={false} />
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
