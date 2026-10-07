import i18n from 'i18next';
import { spokenDate, spokenKg } from '@/features/accessibility/spoken-format';
import type { WeightMeasurementLike } from './chart-geometry';

export function describeWeightEntry({ measuredAt, weightKg }: WeightMeasurementLike): string {
  return `${spokenDate(measuredAt)}, ${spokenKg(Number(weightKg))}`;
}

interface Reading {
  measuredAt: string;
  timestamp: number;
  weightKg: number;
}

function toSortedReadings(measurements: readonly WeightMeasurementLike[]): Reading[] {
  return measurements
    .map((m) => ({
      measuredAt: m.measuredAt,
      timestamp: new Date(m.measuredAt).getTime(),
      weightKg: Number(m.weightKg),
    }))
    .filter((r) => Number.isFinite(r.weightKg) && Number.isFinite(r.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
}

// Neutro de propósito: "redução"/"aumento" descrevem o dado, sem julgar se é
// bom ou ruim — o texto é informativo, nunca prescritivo (RDC 657/2022).
function describeVariation(first: number, last: number): string {
  const delta = Math.round((last - first) * 10) / 10;
  if (delta === 0) return i18n.t('weight.noChange');
  return i18n.t(delta < 0 ? 'weight.decrease' : 'weight.increase', { amount: spokenKg(Math.abs(delta)) });
}

/**
 * Descrição textual do gráfico de peso. Um SVG é invisível para leitor de tela:
 * sem isto, quem não enxerga a linha não recebe informação nenhuma da tela.
 */
export function describeWeightTrend(measurements: readonly WeightMeasurementLike[]): string | null {
  const readings = toSortedReadings(measurements);
  const first = readings[0];
  const last = readings[readings.length - 1];

  if (!first || !last) {
    return null;
  }

  if (readings.length === 1) {
    return i18n.t('weight.chartOne', { weight: spokenKg(first.weightKg), date: spokenDate(first.measuredAt) });
  }

  const weights = readings.map((r) => r.weightKg);

  return [
    i18n.t('weight.chartMany', {
      count: readings.length,
      from: spokenDate(first.measuredAt),
      to: spokenDate(last.measuredAt),
    }),
    i18n.t('weight.chartFirst', { weight: spokenKg(first.weightKg) }),
    i18n.t('weight.chartLast', {
      weight: spokenKg(last.weightKg),
      variation: describeVariation(first.weightKg, last.weightKg),
    }),
    i18n.t('weight.chartMin', { weight: spokenKg(Math.min(...weights)) }),
    i18n.t('weight.chartMax', { weight: spokenKg(Math.max(...weights)) }),
  ].join(' ');
}
