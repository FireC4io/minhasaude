import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MealType } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-row';
import { ModalHeader } from '@/components/ui/modal-header';
import { PREVIEW_FEATURES } from '@/config/features';
import { todayIsoDate } from '@/features/diary/date-utils';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';
import { mealForHour } from '@/features/today/meal-for-hour';

/** Registro rápido a partir do "+" da tela Hoje (F4-20). */
export default function QuickAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayIsoDate();
  const suggested = mealForHour(new Date().getHours());

  // A refeição do horário vem primeiro: é a mais provável.
  const meals: MealType[] = [suggested, ...MEAL_TYPE_ORDER.filter((meal) => meal !== suggested)];

  // `replace`: ao terminar o registro, volta para a Hoje, não para este menu.
  const go = (href: Href) => () => router.replace(href);

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-6">
        <ModalHeader title="Registrar" />

        <View className="gap-1">
          <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
            Alimento
          </AppText>
          <View className="rounded-2xl bg-superficie px-4">
            {meals.map((meal) => (
              <ListRow
                key={meal}
                title={MEAL_TYPE_LABELS[meal]}
                description={meal === suggested ? 'Sugerido pelo horário' : undefined}
                onPress={go({ pathname: '/diary-entry', params: { date, mealType: meal } })}
              />
            ))}
          </View>
        </View>

        <View className="gap-1">
          <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
            Outros registros
          </AppText>
          <View className="rounded-2xl bg-superficie px-4">
            {PREVIEW_FEATURES ? (
              <ListRow title="Água" onPress={go({ pathname: '/water', params: { date } })} />
            ) : null}
            <ListRow title="Peso" onPress={go('/weight-entry')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
