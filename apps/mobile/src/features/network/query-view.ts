export type QueryView = 'loading' | 'error' | 'data';

/**
 * O que a tela mostra para uma consulta do React Query. Sem internet, a
 * atualização falha e a consulta fica com `isError` mesmo tendo o dado da cópia
 * no celular: o dado vence, e erro só aparece quando não há nada para mostrar.
 */
export function queryView(query: { isPending: boolean; data: unknown }): QueryView {
  if (query.data !== undefined) return 'data';
  return query.isPending ? 'loading' : 'error';
}
