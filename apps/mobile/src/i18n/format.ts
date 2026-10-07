import i18n from 'i18next';

import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from './languages';

/**
 * Número e data no formato do idioma em uso. Nada de `'pt-BR'` fixo em
 * `toLocaleString` fora daqui: em inglês, "2,5" tem que virar "2.5".
 */
const INTL_LOCALE: Record<Language, string> = { 'pt-BR': 'pt-BR', en: 'en-US', es: 'es-ES' };

export function appLanguage(): Language {
  const current = i18n.language as Language;
  return LANGUAGES.includes(current) ? current : DEFAULT_LANGUAGE;
}

export function appLocale(): string {
  return INTL_LOCALE[appLanguage()];
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return value.toLocaleString(appLocale(), { maximumFractionDigits });
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(appLocale(), options);
}

/**
 * Singular da unidade falada. Português (norma culta): de 0 (exclusive) até 2
 * (exclusive) — "1,5 quilo", "0 quilos". Inglês e espanhol: só exatamente 1.
 */
export function isSingularUnit(value: number): boolean {
  return appLanguage() === 'pt-BR' ? value !== 0 && Math.abs(value) < 2 : Math.abs(value) === 1;
}
