import { translatedLabels } from '@/i18n/labels';

export const PERIODS = ['30d', '90d', 'all'] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = translatedLabels({
  '30d': 'progress.periods.30d',
  '90d': 'progress.periods.90d',
  all: 'progress.periods.all',
});

const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = { '30d': 30, '90d': 90 };

export function filterByPeriod<T extends { measuredAt: string }>(
  measurements: readonly T[],
  period: Period,
  now: Date = new Date(),
): T[] {
  if (period === 'all') return [...measurements];
  const since = now.getTime() - PERIOD_DAYS[period] * 86_400_000;
  return measurements.filter((m) => new Date(m.measuredAt).getTime() >= since);
}
