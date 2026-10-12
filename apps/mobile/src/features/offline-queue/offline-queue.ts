import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { getBodyMeasurementsControllerListQueryKey } from '@/api/generated/endpoints/body-measurements/body-measurements';
import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerGetByDate,
} from '@/api/generated/endpoints/diary/diary';
import { encryptedStorage } from '@/api/query-client';

import { withPendingEntries } from './merge-pending';
import { isPendingDiary, isPendingWeight, type PendingItem, type PendingState } from './pending-item';
import { createPendingStore } from './pending-store';
import { flushPending, saveOrQueue, type SaveResult } from './pending-sync';

/** A fila do app (uma só, da conta logada). */
export const pendingStore = createPendingStore(encryptedStorage);

/** De quanto em quanto tempo tentar de novo enquanto houver anotação esperando. */
export const RETRY_INTERVAL_MS = 30_000;

export function usePendingState(): PendingState {
  return useSyncExternalStore(pendingStore.subscribe, pendingStore.getState);
}

/** Depois do envio, a tela busca de novo o que mudou no servidor. */
export async function refreshAfterSend(queryClient: QueryClient, sent: readonly PendingItem[]): Promise<void> {
  const dates = new Set(sent.filter(isPendingDiary).map((item) => item.data.date));
  await Promise.all([
    ...[...dates].map((date) =>
      queryClient.invalidateQueries({ queryKey: getDiaryControllerGetByDateQueryKey({ date }) }),
    ),
    ...(sent.some(isPendingWeight)
      ? [queryClient.invalidateQueries({ queryKey: getBodyMeasurementsControllerListQueryKey() })]
      : []),
  ]);
}

export function savePendingItem(item: PendingItem): Promise<SaveResult> {
  return saveOrQueue(pendingStore, item);
}

/** Envia a fila agora e atualiza as telas com o que chegou. */
export function useFlushPending(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    const sent = await flushPending(pendingStore);
    if (sent.length > 0) await refreshAfterSend(queryClient, sent);
  }, [queryClient]);
}

/**
 * Manda a fila sozinho: ao abrir o app, ao voltar para ele e, enquanto houver
 * anotação esperando, a cada 30 s. Usado uma vez, na área logada.
 */
export function useOfflineSync(): void {
  const flush = useFlushPending();
  const { items } = usePendingState();
  const hasPending = items.length > 0;

  useEffect(() => {
    void pendingStore.init().then(flush).catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') flush().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [flush]);

  useEffect(() => {
    if (!hasPending) return undefined;
    const timer = setInterval(() => flush().catch(() => undefined), RETRY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasPending, flush]);
}

/** O dia do diário com as anotações que ainda esperam a internet. */
export function useDayWithPending(date: string, options?: { enabled?: boolean }) {
  const query = useDiaryControllerGetByDate({ date }, { query: options });
  const { items } = usePendingState();
  const pendingDiary = useMemo(() => items.filter(isPendingDiary), [items]);
  const data = useMemo(
    () => (query.data ? withPendingEntries(query.data, pendingDiary) : undefined),
    [query.data, pendingDiary],
  );
  return { query, data };
}
