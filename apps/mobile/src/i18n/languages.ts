import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Idiomas da interface (aprovado em 2026-10-07). Nomes de alimentos da TACO
 * seguem em português: a tradução cobre a interface, não a base de dados.
 */
export const LANGUAGES = ['pt-BR', 'en', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_PREFERENCES = ['system', ...LANGUAGES] as const;
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];

/** Cada idioma escrito nele mesmo: quem não lê português acha o seu. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
};

export const DEFAULT_LANGUAGE: Language = 'pt-BR';

const BY_PREFIX: Record<string, Language> = { pt: 'pt-BR', en: 'en', es: 'es' };

/** Escolha da pessoa, ou o primeiro idioma do celular que o app tem. */
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguageTags: readonly string[],
): Language {
  if (preference !== 'system') return preference;
  for (const tag of deviceLanguageTags) {
    const match = BY_PREFIX[tag.toLowerCase().split('-')[0] ?? ''];
    if (match) return match;
  }
  return DEFAULT_LANGUAGE;
}

const STORAGE_KEY = 'gota-vital:language';

const isPreference = (value: unknown): value is LanguagePreference =>
  LANGUAGE_PREFERENCES.includes(value as LanguagePreference);

export async function loadLanguagePreference(): Promise<LanguagePreference> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export async function saveLanguagePreference(preference: LanguagePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Sem armazenamento a escolha vale só até fechar o app.
  }
}
