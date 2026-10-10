import i18n from 'i18next';

import { formatDate, formatNumber, isSingularUnit } from '@/i18n/format';

/**
 * Números e datas no formato em que o leitor de tela deve falar.
 *
 * O texto visual usa abreviações ("130g", "128 kcal", "12 de set.") que o
 * TalkBack/VoiceOver leem mal ou soletram. Os rótulos de acessibilidade usam
 * estas funções para dizer a unidade por extenso, no idioma em uso.
 */

type Unit = 'kcal' | 'gram' | 'kilo' | 'milliliter' | 'liter';

function withUnit(value: number, formatted: string, unit: Unit): string {
  const word = i18n.t(`units.${unit}.${isSingularUnit(value) ? 'one' : 'other'}`);
  return `${formatted} ${word}`;
}

/** Número para a tela, no formato do idioma: "2,5" em português, "2.5" em inglês. */
export function displayNumber(value: number, maximumFractionDigits = 1): string {
  return formatNumber(value, maximumFractionDigits);
}

export function spokenKcal(value: number): string {
  const rounded = Math.round(value);
  return withUnit(rounded, formatNumber(rounded, 0), 'kcal');
}

export function spokenGrams(value: number): string {
  return withUnit(value, formatNumber(value, 1), 'gram');
}

export function spokenKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return withUnit(rounded, formatNumber(rounded, 1), 'kilo');
}

/** "250 mililitros", "1,5 litro" — a tela mostra "250 ml" e "1,5 L". */
export function spokenMl(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return withUnit(liters, formatNumber(liters, 2), 'liter');
  }
  const rounded = Math.round(ml);
  return withUnit(rounded, formatNumber(rounded, 0), 'milliliter');
}

const FIELD_UNIT = /\s*\((g|cm|kg|ml)\)\s*$/;

/**
 * Rótulo de campo para o leitor de tela: "Altura (cm)" vira "Altura, em
 * centímetros" — a sigla entre parênteses seria lida como "c m".
 */
export function spokenFieldLabel(label: string): string {
  const match = FIELD_UNIT.exec(label);
  if (!match) return label;
  const unit = match[1] as 'g' | 'cm' | 'kg' | 'ml';
  return `${label.slice(0, match.index)}, ${i18n.t(`units.field.${unit}`)}`;
}

export function spokenDate(isoDateTime: string): string {
  return formatDate(new Date(isoDateTime), { day: 'numeric', month: 'long', year: 'numeric' });
}
