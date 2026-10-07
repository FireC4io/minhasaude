import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type Query } from '@tanstack/react-query';

import { MAX_OFFLINE_COPY_MS } from '@/features/preferences/offline-copy-preference';

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
 * Contém dado de saúde (diário, peso) sem criptografia no armazenamento do
 * app — por isso a pessoa escolhe por quanto tempo ela fica sem abrir o app
 * (1, 7 ou 30 dias, padrão 1; ver `offline-copy-preference`), e ela é apagada
 * ao sair da conta, ao expirar a sessão e ao excluir a conta
 * (`clearPersistedCache`).
 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gota-vital:query-cache',
  throttleTime: 2000,
});

/** Só respostas de sucesso, e nunca nada de autenticação. */
export function shouldPersistQuery(query: Pick<Query, 'queryKey' | 'state'>): boolean {
  const [first] = query.queryKey;
  return (
    query.state.status === 'success' && !(typeof first === 'string' && first.includes('/auth'))
  );
}

export async function clearPersistedCache(): Promise<void> {
  queryClient.clear();
  try {
    await queryPersister.removeClient();
  } catch {
    // Sem armazenamento não há cópia a apagar.
  }
}
