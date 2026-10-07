import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBodyMeasurementsControllerList } from '@/api/generated/endpoints/body-measurements/body-measurements';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { PREVIEW_FEATURES } from '@/config/features';
import { SelectChips } from '@/features/onboarding/select-chips';
import { PERIODS, PERIOD_LABELS, filterByPeriod, type Period } from '@/features/progress/period';
import { WeeklyAverageCard } from '@/features/progress/weekly-average-card';
import { WeightChart } from '@/features/weight/weight-chart';
import { WeightEntryForm } from '@/features/weight/weight-entry-form';
import { WeightHistoryList } from '@/features/weight/weight-history-list';

// Só medidas registradas na mão: o app nunca mistura fontes no mesmo gráfico,
// porque bioimpedância de aparelhos diferentes não é comparável (CLAUDE.md).
const LIST_PARAMS = { source: 'manual', limit: 100 } as const;

/** Progresso (F4-33): peso com período, médias semanais e espaço dos exames. */
export default function ProgressScreen() {
  const historyQuery = useBodyMeasurementsControllerList(LIST_PARAMS);
  const [period, setPeriod] = useState<Period>('90d');

  const all = historyQuery.data?.data ?? [];
  const inPeriod = filterByPeriod(all, period);

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-6 py-8" keyboardShouldPersistTaps="handled">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">
            Progresso
          </AppText>

          <View className="gap-4">
            <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
              Peso
            </AppText>
            <WeightEntryForm />

            {historyQuery.isPending ? (
              <LoadingIndicator label="Carregando seu histórico de peso" />
            ) : historyQuery.isError ? (
              <FormError message="Não foi possível carregar seu histórico agora. Confira sua internet." />
            ) : (
              <>
                <SelectChips
                  label="Período"
                  options={PERIODS}
                  optionLabels={PERIOD_LABELS}
                  value={period}
                  onChange={setPeriod}
                />
                <WeightChart measurements={inPeriod} />
                <WeightHistoryList measurements={inPeriod} />
              </>
            )}
          </View>

          <WeeklyAverageCard />

          {PREVIEW_FEATURES ? (
            <View className="gap-2 rounded-2xl bg-superficie p-4">
              <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
                Exames
              </AppText>
              <AppText className="text-grafite">
                Quando você guardar exames, a evolução de marcadores como glicose e colesterol vai
                aparecer aqui. Veja a aba Exames.
              </AppText>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
