import type { PlainStorage } from '@/api/encrypted-storage';

import { EMPTY_PENDING_STATE, type FailedItem, type PendingItem, type PendingState } from './pending-item';

const STORAGE_KEY = 'gota-vital:pending-entries';

export interface PendingStore {
  /** Lê o que ficou guardado da última vez (uma vez só). */
  init(): Promise<void>;
  getState(): PendingState;
  subscribe(listener: () => void): () => void;
  add(item: PendingItem): Promise<void>;
  /** Tira da fila: chegou ao servidor ou a pessoa desistiu. */
  remove(clientId: string): Promise<void>;
  /** Tira da fila e avisa a pessoa que o servidor recusou. */
  fail(item: PendingItem, label: string): Promise<void>;
  dismissFailed(clientId: string): Promise<void>;
  /** Logout: nada de dado de saúde para trás. */
  clear(): Promise<void>;
}

function parseState(raw: string | null): PendingState {
  if (!raw) return EMPTY_PENDING_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingState>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      failed: Array.isArray(parsed.failed) ? parsed.failed : [],
    };
  } catch {
    return EMPTY_PENDING_STATE;
  }
}

/**
 * Fila das anotações feitas sem internet, em memória e gravada no aparelho.
 * O armazenamento é o mesmo da cópia do cache: cifrado, com a chave apagada
 * no logout (é dado de saúde).
 */
export function createPendingStore(storage: PlainStorage): PendingStore {
  let state: PendingState = EMPTY_PENDING_STATE;
  let loading: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function emit(): void {
    for (const listener of listeners) listener();
  }

  // Toda mudança espera a leitura do aparelho: gravar antes dela apagaria o que estava guardado.
  function init(): Promise<void> {
    loading ??= storage
      .getItem(STORAGE_KEY)
      .catch(() => null)
      .then((raw) => {
        state = parseState(raw);
        emit();
      });
    return loading;
  }

  async function update(change: (current: PendingState) => PendingState): Promise<void> {
    await init();
    state = change(state);
    emit();
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Sem armazenamento a fila vive só enquanto o app está aberto.
    }
  }

  return {
    init,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add: (item) =>
      update((current) =>
        current.items.some((existing) => existing.clientId === item.clientId)
          ? current
          : { ...current, items: [...current.items, item] },
      ),
    remove: (clientId) =>
      update((current) => ({ ...current, items: current.items.filter((item) => item.clientId !== clientId) })),
    fail(item, label) {
      const failed: FailedItem = { clientId: item.clientId, kind: item.kind, label };
      return update((current) => ({
        items: current.items.filter((existing) => existing.clientId !== item.clientId),
        failed: [...current.failed, failed],
      }));
    },
    dismissFailed: (clientId) =>
      update((current) => ({ ...current, failed: current.failed.filter((item) => item.clientId !== clientId) })),
    async clear() {
      // Leitura ainda em andamento não pode trazer de volta o que foi apagado.
      await init();
      state = EMPTY_PENDING_STATE;
      emit();
      try {
        await storage.removeItem(STORAGE_KEY);
      } catch {
        // Sem armazenamento não há o que apagar.
      }
    },
  };
}
