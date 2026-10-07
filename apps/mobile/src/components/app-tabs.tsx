import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { GotaVitalColors } from '@/constants/gota-vital-colors';

export default function AppTabs() {
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  // Selecionado em mamão forte, o resto em grafite suave: os dois passam 4,5:1
  // sobre a superfície nos dois temas (ver contrast.spec.ts).
  return (
    <NativeTabs
      backgroundColor={colors.superficie}
      indicatorColor={colors.areia}
      iconColor={{ default: colors.grafiteSuave, selected: colors.mamaoForte }}
      labelStyle={{
        default: { color: colors.grafiteSuave },
        selected: { color: colors.mamaoForte },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Diário</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/diary.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="weight">
        <NativeTabs.Trigger.Label>Peso</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/weight.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
