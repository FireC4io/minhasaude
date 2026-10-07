import { appLocale } from '@/i18n/format';

/**
 * Peso para exibição: "68,9 kg". `toFixed` usaria ponto, e a mesma tela falava
 * "68,9 quilos" ao leitor de tela — o visual e o falado precisam concordar.
 */
export function formatKg(value: number | string): string {
  const formatted = Number(value).toLocaleString(appLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formatted} kg`;
}
