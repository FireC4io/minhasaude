import { resolveRootRoute } from './root-route';

function goalQuery(overrides: Partial<Parameters<typeof resolveRootRoute>[0]['goal']> = {}) {
  return { isPending: false, isSuccess: false, error: null, ...overrides };
}

function httpError(status: number) {
  return { response: { status } };
}

describe('resolveRootRoute', () => {
  it('manda para auth quando não autenticado, mesmo com a query de meta pendente', () => {
    // Query desabilitada no React Query v5 fica com isPending true — não pode
    // ser confundida com "carregando".
    const route = resolveRootRoute({
      isAuthenticated: false,
      goal: goalQuery({ isPending: true }),
    });

    expect(route).toBe('auth');
  });

  it('manda para o app quando a meta atual foi carregada', () => {
    const route = resolveRootRoute({
      isAuthenticated: true,
      goal: goalQuery({ isSuccess: true }),
    });

    expect(route).toBe('app');
  });

  it('espera enquanto a meta ainda está sendo buscada', () => {
    const route = resolveRootRoute({
      isAuthenticated: true,
      goal: goalQuery({ isPending: true }),
    });

    expect(route).toBe('loading');
  });

  it('manda para o onboarding quando a API responde 404 (usuário ainda sem meta)', () => {
    const route = resolveRootRoute({
      isAuthenticated: true,
      goal: goalQuery({ error: httpError(404) }),
    });

    expect(route).toBe('onboarding');
  });

  it.each([500, 502, 401, 403])(
    'não manda para o onboarding quando a API falha com %i',
    (status) => {
      const route = resolveRootRoute({
        isAuthenticated: true,
        goal: goalQuery({ error: httpError(status) }),
      });

      expect(route).toBe('goal-unavailable');
    },
  );

  it('não manda para o onboarding em erro de rede sem resposta HTTP', () => {
    // Caso real: CORS ou API fora do ar. Antes isso jogava um usuário que já
    // tem meta de volta no onboarding, pedindo o consentimento de novo.
    const route = resolveRootRoute({
      isAuthenticated: true,
      goal: goalQuery({ error: new Error('Network Error') }),
    });

    expect(route).toBe('goal-unavailable');
  });

  it('aceita status no formato plano do axios (error.status)', () => {
    const route = resolveRootRoute({
      isAuthenticated: true,
      goal: goalQuery({ error: { status: 404 } }),
    });

    expect(route).toBe('onboarding');
  });
});
