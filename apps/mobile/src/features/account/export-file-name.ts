import { todayIsoDate } from '@/features/diary/date-utils';

export function exportFileName(now: Date = new Date()): string {
  return `gota-vital-meus-dados-${todayIsoDate(now)}.json`;
}
