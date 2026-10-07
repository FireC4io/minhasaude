import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type Query } from '@tanstack/react-query';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O cache precisa viver ao menos tanto quanto a cópia gravada no aparelho.
      gcTime: ONE_DAY_MS,
      retry: 2,
    },
  },
});

/**
 * Cópia do cache no aparelho (F4-18): o que já foi carregado continua visível
 * sem internet ou enquanto o servidor gratuito acorda.
 *
 * Contém dado de saúde (diário, peso) sem criptografia no armazenamento do
 * app — por isso dura no máximo 24 h e é apagada ao sair da conta, ao expirar
 * a sessão e ao excluir a conta (`clearPersistedCache`).
 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gota-vital:query-cache',
  throttleTime: 2000,
});

export const PERSIST_MAX_AGE_MS = ONE_DAY_MS;

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
