import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Por quanto tempo a cópia do cache fica no aparelho sem a pessoa abrir o app
 * (decisão do dono, 2026-10-07: a pessoa escolhe, no máximo 30 dias).
 *
 * O `maxAge` do React Query mede o tempo desde a última gravação da cópia, e
 * ela é regravada a cada uso. Por isso o texto da tela fala em "sem abrir o
 * app", não em idade do dado.
 */
export const OFFLINE_COPY_DAYS = ['1', '7', '30'] as const;
export type OfflineCopyDays = (typeof OFFLINE_COPY_DAYS)[number];

export const OFFLINE_COPY_LABELS: Record<OfflineCopyDays, string> = {
  '1': '1 dia',
  '7': '7 dias',
  '30': '30 dias',
};

const DEFAULT_DAYS: OfflineCopyDays = '1';
const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'gota-vital:offline-copy-days';

export const MAX_OFFLINE_COPY_MS = 30 * DAY_MS;

const isOfflineCopyDays = (value: unknown): value is OfflineCopyDays =>
  OFFLINE_COPY_DAYS.includes(value as OfflineCopyDays);

export function offlineCopyMaxAgeMs(days: OfflineCopyDays): number {
  return Math.min(Number(days) * DAY_MS, MAX_OFFLINE_COPY_MS);
}

/** Se o armazenamento falhar, fica o padrão mais curto. */
export async function loadOfflineCopyDays(): Promise<OfflineCopyDays> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isOfflineCopyDays(stored) ? stored : DEFAULT_DAYS;
  } catch {
    return DEFAULT_DAYS;
  }
}

export async function saveOfflineCopyDays(days: OfflineCopyDays): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, days);
  } catch {
    // Sem armazenamento a escolha vale só até fechar o app.
  }
}
