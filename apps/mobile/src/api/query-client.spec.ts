import { shouldPersistQuery } from './query-client';

const query = (key: unknown, status: 'success' | 'error' | 'pending') =>
  ({ queryKey: [key], state: { status } }) as unknown as Parameters<typeof shouldPersistQuery>[0];

describe('shouldPersistQuery', () => {
  it('guarda respostas de sucesso dos dados do app', () => {
    expect(shouldPersistQuery(query('/v1/diary', 'success'))).toBe(true);
  });

  it('não guarda erro nem carregamento', () => {
    expect(shouldPersistQuery(query('/v1/diary', 'error'))).toBe(false);
    expect(shouldPersistQuery(query('/v1/diary', 'pending'))).toBe(false);
  });

  it('nunca guarda nada de autenticação', () => {
    expect(shouldPersistQuery(query('/v1/auth/me', 'success'))).toBe(false);
  });
});
