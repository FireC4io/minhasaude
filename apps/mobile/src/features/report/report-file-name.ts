import { todayIsoDate } from '@/features/diary/date-utils';

export function reportFileName(now: Date = new Date()): string {
  return `gota-vital-relatorio-${todayIsoDate(now)}.pdf`;
}
