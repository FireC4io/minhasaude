import type { PersistedClient } from '@tanstack/react-query-persist-client';

import { shouldPersistQuery, withoutErrors } from './query-client';

const query = (key: unknown, status: 'success' | 'error' | 'pending', data?: unknown) =>
  ({ queryKey: [key], state: { status, data } }) as unknown as Parameters<typeof shouldPersistQuery>[0];

describe('shouldPersistQuery', () => {
  it('guarda respostas de sucesso dos dados do app', () => {
    expect(shouldPersistQuery(query('/v1/diary', 'success', { meals: {} }))).toBe(true);
  });

  it('guarda o dado mesmo se a atualização falhou sem internet', () => {
    expect(shouldPersistQuery(query('/v1/diary', 'error', { meals: {} }))).toBe(true);
  });

  it('não guarda erro nem carregamento sem dado', () => {
    expect(shouldPersistQuery(query('/v1/diary', 'error'))).toBe(false);
    expect(shouldPersistQuery(query('/v1/diary', 'pending'))).toBe(false);
  });

  it('nunca guarda nada de autenticação', () => {
    expect(shouldPersistQuery(query('/v1/auth/me', 'success', { id: 1 }))).toBe(false);
  });
});

describe('withoutErrors', () => {
  it('grava a consulta com erro como sucesso e sem o erro (que leva o token)', () => {
    const client = {
      timestamp: 1,
      buster: '',
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ['/v1/diary'],
            queryHash: 'x',
            state: {
              status: 'error',
              data: { meals: {} },
              error: { config: { headers: { Authorization: 'Bearer segredo' } } },
              fetchFailureReason: { config: {} },
              fetchStatus: 'idle',
            },
          },
        ],
      },
    } as unknown as PersistedClient;

    const [saved] = withoutErrors(client).clientState.queries;
    expect(saved?.state).toMatchObject({ status: 'success', error: null, fetchFailureReason: null, data: { meals: {} } });
    expect(JSON.stringify(saved)).not.toContain('segredo');
  });
});
