import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

import { translatedLabels } from '@/i18n/labels';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = translatedLabels({
  system: 'labels.theme.system',
  light: 'labels.theme.light',
  dark: 'labels.theme.dark',
});

const STORAGE_KEY = 'gota-vital:theme';

const isThemePreference = (value: unknown): value is ThemePreference =>
  THEME_PREFERENCES.includes(value as ThemePreference);

/** Preferência é conveniência local: se o armazenamento falhar, segue o aparelho. */
export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Sem armazenamento a escolha vale só até fechar o app — não é motivo de erro na tela.
  }
}

/**
 * No celular, o NativeWind repassa ao `Appearance` do sistema, então o
 * `useColorScheme` do React Native (usado nas abas e no gráfico) acompanha.
 */
export function applyThemePreference(preference: ThemePreference): void {
  colorScheme.set(preference);
}
