import { t } from 'i18next';
import { gramsFromOunces } from '@minhasaude/shared';

import { DiaryQuantityUnit, type PortionResponseDto } from '@/api/generated/models';
import { spokenGrams } from '@/features/accessibility/spoken-format';
import { formatNumber } from '@/i18n/format';
import type { Language } from '@/i18n/languages';

export type PortionLike = Pick<PortionResponseDto, 'id' | 'kind' | 'label' | 'grams' | 'custom'>;

/** Como a pessoa mede a quantidade. Onça é só conversão: grava em gramas. */
export type Measure = { type: 'grams' } | { type: 'ounces' } | { type: 'portion'; portion: PortionLike };

export const GRAMS: Measure = { type: 'grams' };
export const OUNCES: Measure = { type: 'ounces' };

const SHORTCUTS: Record<Measure['type'], readonly number[]> = {
  grams: [50, 100, 150, 200],
  ounces: [1, 2, 4, 8],
  portion: [0.5, 1, 2, 3],
};

export function measureKey(measure: Measure): string {
  return measure.type === 'portion' ? measure.portion.id : measure.type;
}

export function shortcutsFor(measure: Measure): readonly number[] {
  return SHORTCUTS[measure.type];
}

/** Onça só aparece em inglês: quem usa o app em português ou espanhol mede em gramas. */
export function offersOunces(language: Language): boolean {
  return language === 'en';
}

/** Quantidade inicial ao trocar de medida: 100 g, 4 oz ou 1 da medida caseira. */
export function defaultAmount(measure: Measure): number {
  if (measure.type === 'grams') return 100;
  if (measure.type === 'ounces') return 4;
  return 1;
}

export function gramsOf(measure: Measure, amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (measure.type === 'grams') return amount;
  if (measure.type === 'ounces') return gramsFromOunces(amount);
  return Math.round(amount * Number(measure.portion.grams) * 100) / 100;
}

export interface EntryQuantity {
  quantity: number;
  unit: DiaryQuantityUnit;
  portionId?: string;
}

/** O que vai para a API: gramas (inclusive quando a pessoa digitou onças) ou N medidas. */
export function entryQuantity(measure: Measure, amount: number): EntryQuantity {
  if (measure.type === 'portion') {
    return { quantity: amount, unit: DiaryQuantityUnit.portion, portionId: measure.portion.id };
  }
  return { quantity: gramsOf(measure, amount), unit: DiaryQuantityUnit.grams };
}

interface EntryLike {
  quantity: string;
  unit: DiaryQuantityUnit;
  portion?: PortionLike | null;
}

/** Medida e quantidade de uma anotação já feita, para abrir a edição como foi salva. */
export function measureFromEntry(entry: EntryLike): { measure: Measure; amount: number } {
  if (entry.unit === DiaryQuantityUnit.portion && entry.portion) {
    return { measure: { type: 'portion', portion: entry.portion }, amount: Number(entry.quantity) };
  }
  return { measure: GRAMS, amount: Number(entry.quantity) };
}

/** Nome da medida no idioma do app; a criada pela pessoa fica como ela escreveu. */
export function portionName(portion: PortionLike, count = 1): string {
  if (portion.kind) return t(`portions.kinds.${portion.kind}`, { count: count > 1 ? 2 : 1 });
  return portion.label ?? '';
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Opção na lista de medidas: "Colher de sopa (25 g)". */
export function measureOption(measure: Measure): { label: string; spoken: string } {
  if (measure.type === 'grams') return { label: t('portions.grams'), spoken: t('portions.grams') };
  if (measure.type === 'ounces') return { label: t('portions.ounces'), spoken: t('portions.ounces') };
  const name = capitalize(portionName(measure.portion));
  const grams = Number(measure.portion.grams);
  return {
    label: t('portions.option', { name, grams: formatNumber(grams, 1) }),
    spoken: t('portions.optionSpoken', { name, grams: spokenGrams(grams) }),
  };
}

/** Quantidade já anotada, para a lista do dia: "2 colheres de sopa (50 g)" ou "100 g". */
export function describeAmount(entry: EntryLike): { text: string; spoken: string } {
  const { measure, amount } = measureFromEntry(entry);
  const grams = gramsOf(measure, amount);
  if (measure.type !== 'portion') {
    return { text: `${formatNumber(grams, 1)} g`, spoken: spokenGrams(grams) };
  }
  const name = portionName(measure.portion, amount);
  const formatted = formatNumber(amount, 2);
  return {
    text: t('portions.summary', { amount: formatted, name, grams: formatNumber(grams, 0) }),
    spoken: t('portions.summarySpoken', { amount: formatted, name, grams: spokenGrams(Math.round(grams)) }),
  };
}

/** Rótulo do campo de quantidade conforme a medida escolhida. */
export function amountLabel(measure: Measure): string {
  if (measure.type === 'grams') return t('portions.amountGrams');
  if (measure.type === 'ounces') return t('portions.amountOunces');
  return t('portions.amountPortion', { name: portionName(measure.portion, 2) });
}

/** Atalho de quantidade: "50 g", "2 oz", "½" — e como o leitor de tela fala. */
export function shortcutLabel(measure: Measure, amount: number): { label: string; spoken: string } {
  if (measure.type === 'grams') return { label: `${amount} g`, spoken: spokenGrams(amount) };
  if (measure.type === 'ounces') return { label: `${amount} oz`, spoken: t('portions.ounceSpoken', { count: amount }) };
  const label = amount === 0.5 ? '½' : formatNumber(amount, 1);
  return {
    label,
    spoken: t('portions.shortcutSpoken', { amount: formatNumber(amount, 1), name: portionName(measure.portion, amount) }),
  };
}
