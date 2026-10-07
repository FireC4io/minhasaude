import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { GotaVitalColors } from '@/constants/gota-vital-colors';

export default function AppTabs() {
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  // Selecionado em mamão forte, o resto em grafite suave: os dois passam 4,5:1
  // sobre a superfície nos dois temas (ver contrast.spec.ts).
  return (
    <NativeTabs
      // Rótulo sempre visível: só o ícone não basta para quem tem pouca familiaridade com apps.
      labelVisibilityMode="labeled"
      backgroundColor={colors.superficie}
      indicatorColor={colors.areia}
      iconColor={{ default: colors.grafiteSuave, selected: colors.mamaoForte }}
      labelStyle={{
        default: { color: colors.grafiteSuave },
        selected: { color: colors.mamaoForte },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hoje</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/diary.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Progresso</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/progress.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exams">
        <NativeTabs.Trigger.Label>Exames</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/exams.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/profile.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
