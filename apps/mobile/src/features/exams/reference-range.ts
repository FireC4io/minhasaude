/**
 * Faixa de referência como o laboratório escreveu no laudo, e a posição do
 * valor nela. A comparação é sempre com a faixa **do próprio laudo** — o app
 * não tem tabela de referência própria e não diz se algo é "normal".
 */

import { translatedLabels } from '@/i18n/labels';

export interface ReferenceRange {
  low: number | null;
  high: number | null;
}

export type RangePosition = 'below' | 'within' | 'above' | 'unknown';

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;
const toNumber = (text: string): number => Number(text.replace(',', '.'));

export function parseReferenceRange(text: string | null): ReferenceRange | null {
  if (!text) return null;
  const normalized = text.toLowerCase();

  const between = new RegExp(`${NUMBER}\\s*(?:a|-|–|até)\\s*${NUMBER}`).exec(normalized);
  if (between?.[1] && between[2]) return { low: toNumber(between[1]), high: toNumber(between[2]) };

  const upper = new RegExp(`(?:<|≤|inferior a|menor que|menor ou igual a|até)\\s*${NUMBER}`).exec(
    normalized,
  );
  if (upper?.[1]) return { low: null, high: toNumber(upper[1]) };

  const lower = new RegExp(`(?:>|≥|superior a|maior que|maior ou igual a)\\s*${NUMBER}`).exec(
    normalized,
  );
  if (lower?.[1]) return { low: toNumber(lower[1]), high: null };

  return null;
}

export function positionInRange(value: number, range: ReferenceRange | null): RangePosition {
  if (!range) return 'unknown';
  if (range.low !== null && value < range.low) return 'below';
  if (range.high !== null && value > range.high) return 'above';
  return 'within';
}

const POSITION_TEXT: Record<RangePosition, string> = translatedLabels({
  below: 'exams.position.below',
  within: 'exams.position.within',
  above: 'exams.position.above',
  unknown: 'exams.position.unknown',
});

export function describePosition(position: RangePosition): string {
  return POSITION_TEXT[position];
}
