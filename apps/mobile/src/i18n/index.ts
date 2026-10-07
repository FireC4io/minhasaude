import { getLocales } from 'expo-localization';
import i18n, { changeLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { es } from './locales/es';
import { ptBR } from './locales/pt-BR';
import { DEFAULT_LANGUAGE, resolveLanguage, type Language, type LanguagePreference } from './languages';

function deviceLanguageTags(): string[] {
  try {
    return getLocales().map((locale) => locale.languageTag);
  } catch {
    return [];
  }
}

// `i18n.use` e não o `use` nomeado: o lint de hooks confunde com o `use` do React.
// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
  },
  lng: resolveLanguage('system', deviceLanguageTags()),
  fallbackLng: DEFAULT_LANGUAGE,
  // React já escapa o texto; escapar aqui mostraria "&amp;" na tela.
  interpolation: { escapeValue: false },
});

export async function applyLanguagePreference(preference: LanguagePreference): Promise<void> {
  await changeLanguage(resolveLanguage(preference, deviceLanguageTags()));
}

/** Idioma em uso, para formatar número e data (`toLocaleString`). */
export function currentLanguage(): Language {
  return (i18n.language as Language) ?? DEFAULT_LANGUAGE;
}

export default i18n;
