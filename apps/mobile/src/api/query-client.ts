import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type Query } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

import { MAX_OFFLINE_COPY_MS } from '@/features/preferences/offline-copy-preference';

import { createEncryptedStorage } from './encrypted-storage';
import { cacheKeyStore } from './token-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O cache precisa viver ao menos tanto quanto a cópia gravada no aparelho:
      // com gcTime menor, a consulta some da memória e é apagada da cópia.
      gcTime: MAX_OFFLINE_COPY_MS,
      retry: 2,
    },
  },
});

/**
 * Cópia do cache no aparelho (F4-18): o que já foi carregado continua visível
 * sem internet ou enquanto o servidor gratuito acorda.
 *
 * Contém dado de saúde (diário, peso), então é gravada cifrada com chave no
 * Keystore (`encrypted-storage`, achado 4 da avaliação de segurança). A pessoa
 * escolhe por quanto tempo ela fica sem abrir o app (1, 7 ou 30 dias, padrão 1;
 * ver `offline-copy-preference`), e cópia e chave são apagadas ao sair da
 * conta, ao expirar a sessão e ao excluir a conta (`clearPersistedCache`).
 */
export const encryptedStorage = createEncryptedStorage(AsyncStorage, cacheKeyStore);

const storagePersister = createAsyncStoragePersister({
  storage: encryptedStorage,
  key: 'gota-vital:query-cache',
  throttleTime: 2000,
});

/**
 * Sem internet, a atualização falha e a consulta fica com status de erro mesmo
 * tendo o dado: é justamente a cópia que importa. Grava como sucesso e sem o
 * erro (o do axios leva a configuração do pedido, com o token de acesso).
 */
export function withoutErrors(client: PersistedClient): PersistedClient {
  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries: client.clientState.queries.map((query) =>
        query.state.status === 'error'
          ? {
              ...query,
              state: { ...query.state, status: 'success', error: null, fetchFailureReason: null, fetchStatus: 'idle' },
            }
          : query,
      ),
    },
  };
}

export const queryPersister: Persister = {
  ...storagePersister,
  persistClient: (client) => storagePersister.persistClient(withoutErrors(client)),
};

/** Só o que tem dado, e nunca nada de autenticação. */
export function shouldPersistQuery(query: Pick<Query, 'queryKey' | 'state'>): boolean {
  const [first] = query.queryKey;
  return query.state.data !== undefined && !(typeof first === 'string' && first.includes('/auth'));
}

export async function clearPersistedCache(): Promise<void> {
  queryClient.clear();
  try {
    await queryPersister.removeClient();
  } catch {
    // Sem armazenamento não há cópia a apagar.
  }
  try {
    // Sem a chave, qualquer resto da cópia fica ilegível.
    await encryptedStorage.forgetKey();
  } catch {
    // Sem Keystore não há chave a apagar.
  }
}
