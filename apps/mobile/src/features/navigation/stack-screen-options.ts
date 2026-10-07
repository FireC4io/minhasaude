import type { NativeStackNavigationOptions } from 'expo-router';
import { useColorScheme } from 'react-native';

import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { useReduceMotion } from '@/features/accessibility/use-reduce-motion';

/** Cabeçalho das pilhas internas (Perfil, exames) na paleta e na tipografia do app. */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const reduceMotion = useReduceMotion();
  return {
    // Sem deslizar entre telas para quem pediu menos movimento no sistema (F4-11).
    animation: reduceMotion ? 'none' : 'default',
    headerStyle: { backgroundColor: colors.areia },
    headerTintColor: colors.grafite,
    headerTitleStyle: { fontFamily: 'WorkSans_600SemiBold', color: colors.grafite },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: colors.areia },
  };
}
