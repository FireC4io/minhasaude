import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';

/** Provisória: as telas de exame entram na etapa I (prévia). */
export default function ExamsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          Exames
        </AppText>
        <View className="gap-2 rounded-2xl bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            Em breve
          </AppText>
          <AppText className="text-grafite">
            Aqui você vai poder guardar seus exames de sangue e de bioimpedância e acompanhar os
            resultados ao longo do tempo.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
