import { bodyMeasurementsControllerCreate } from '@/api/generated/endpoints/body-measurements/body-measurements';
import { diaryControllerCreate } from '@/api/generated/endpoints/diary/diary';
import { formatKg } from '@/features/weight/format-weight';

import type { PendingItem } from './pending-item';
import type { PendingStore } from './pending-store';
import { sendOutcome } from './send-outcome';

export type Sender = (item: PendingItem, signal: AbortSignal) => Promise<unknown>;

/**
 * Quanto esperar o servidor antes de guardar a anotação no aparelho. O plano
 * gratuito leva até um minuto para acordar: esperar isso tudo parece app
 * travado. Se o pedido chegar mesmo assim, o reenvio não duplica (`clientId`).
 */
export const SEND_TIMEOUT_MS = 20_000;

export const defaultSender: Sender = (item, signal) =>
  item.kind === 'diary'
    ? diaryControllerCreate(item.data, signal)
    : bodyMeasurementsControllerCreate(item.data, signal);

async function sendWithTimeout(send: Sender, item: PendingItem, timeoutMs: number): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await send(item, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Como a anotação recusada aparece no aviso: o alimento ou o peso. */
export function pendingLabel(item: PendingItem): string {
  return item.kind === 'diary' ? item.food.name : formatKg(item.data.weightKg);
}

export type SaveResult = 'sent' | 'queued';

/**
 * Tenta enviar agora; sem internet (ou servidor que não responde a tempo),
 * guarda na fila e devolve `queued`. Recusa do servidor é erro de verdade e
 * sobe para a tela mostrar.
 */
export async function saveOrQueue(
  store: PendingStore,
  item: PendingItem,
  send: Sender = defaultSender,
  timeoutMs = SEND_TIMEOUT_MS,
): Promise<SaveResult> {
  try {
    await sendWithTimeout(send, item, timeoutMs);
    return 'sent';
  } catch (error) {
    if (sendOutcome(error) === 'reject') throw error;
    await store.add(item);
    return 'queued';
  }
}

const running = new WeakMap<PendingStore, Promise<PendingItem[]>>();

/**
 * Envia a fila, na ordem em que foi anotada. Devolve o que chegou ao servidor
 * (para a tela buscar os dados de novo). Sem resposta nenhuma, para: a
 * internet ainda não voltou. Uma chamada por vez.
 */
export function flushPending(
  store: PendingStore,
  send: Sender = defaultSender,
  timeoutMs = SEND_TIMEOUT_MS,
): Promise<PendingItem[]> {
  const current = running.get(store);
  if (current) return current;

  const run = (async () => {
    await store.init();
    const sent: PendingItem[] = [];
    for (const item of store.getState().items) {
      try {
        await sendWithTimeout(send, item, timeoutMs);
        await store.remove(item.clientId);
        sent.push(item);
      } catch (error) {
        const outcome = sendOutcome(error);
        if (outcome === 'offline') break;
        if (outcome === 'reject') await store.fail(item, pendingLabel(item));
      }
    }
    return sent;
  })().finally(() => running.delete(store));

  running.set(store, run);
  return run;
}
