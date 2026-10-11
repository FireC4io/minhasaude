import { privacyPolicyFromConsents, resolveRootRoute } from './root-route';

function goalQuery(overrides: Partial<Parameters<typeof resolveRootRoute>[0]['goal']> = {}) {
  return { isPending: false, isSuccess: false, error: null, ...overrides };
}

function httpError(status: number) {
  return { response: { status } };
}

describe('resolveRootRoute', () => {
  it('espera a sessão salva ser lida antes de decidir qualquer rota', () => {
    // Sem isso, o primeiro render via "não autenticado", montava o grupo de
    // auth e a URL pedida (ex.: /weight num reload) se perdia no redirecionamento.
    const route = resolveRootRoute({
      isAuthenticated: false,
      isRestoringSession: true,
      goal: goalQuery({ isPending: true }),
    });

    expect(route).toBe('loading');
  });

  it('decide normalmente depois que a sessão foi lida', () => {
    const route = resolveRootRoute({
      isAuthenticated: false,
      isRestoringSession: false,
      goal: goalQuery({ isPending: true }),
    });

    expect(route).toBe('auth');
  });

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

  it('abre o app com a meta da cópia no aparelho quando a atualização falha sem internet', () => {
    // O React Query marca a consulta como erro mesmo com o dado restaurado da
    // cópia; olhar só isSuccess mostrava "não foi possível carregar" offline.
    const route = resolveRootRoute({
      isAuthenticated: true,
      goal: goalQuery({ hasData: true, error: new Error('Network Error') }),
    });

    expect(route).toBe('app');
  });

  it('aceita status no formato plano do axios (error.status)', () => {
    const route = resolveRootRoute({
      isAuthenticated: true,
      goal: goalQuery({ error: { status: 404 } }),
    });

    expect(route).toBe('onboarding');
  });

  describe('política de privacidade atualizada', () => {
    const current = '2026-10';
    const withPolicy = (privacyPolicy: Parameters<typeof resolveRootRoute>[0]['privacyPolicy']) =>
      resolveRootRoute({
        isAuthenticated: true,
        goal: goalQuery({ isSuccess: true }),
        privacyPolicy,
        currentPolicyVersion: current,
      });

    it('pede o aceite de novo a quem aceitou uma versão antiga', () => {
      expect(withPolicy({ status: 'loaded', granted: true, version: '2026-01' })).toBe('policy-update');
    });

    it('segue para o app quem já aceitou a versão atual ou uma mais nova', () => {
      expect(withPolicy({ status: 'loaded', granted: true, version: current })).toBe('app');
      expect(withPolicy({ status: 'loaded', granted: true, version: '2027-01' })).toBe('app');
    });

    it('espera a lista de consentimentos antes de abrir o app', () => {
      expect(withPolicy({ status: 'loading' })).toBe('loading');
    });

    it('sem conseguir ler os consentimentos (sem internet), não trava o app', () => {
      expect(withPolicy({ status: 'error' })).toBe('app');
    });

    it('consentimento revogado não vira tela de reaceite (a revogação tem fluxo próprio)', () => {
      expect(withPolicy({ status: 'loaded', granted: false, version: '2026-01' })).toBe('app');
    });

    it('sem informação de política, decide como antes', () => {
      expect(resolveRootRoute({ isAuthenticated: true, goal: goalQuery({ isSuccess: true }) })).toBe('app');
    });
  });

  describe('privacyPolicyFromConsents', () => {
    const query = (overrides: Partial<Parameters<typeof privacyPolicyFromConsents>[0]>) => ({
      isPending: false,
      isError: false,
      data: undefined,
      ...overrides,
    });

    it('acha o aceite da política na lista de consentimentos', () => {
      const data = [
        { consentType: 'exam_data_processing', granted: false, policyVersion: null },
        { consentType: 'privacy_policy', granted: true, policyVersion: '2026-01' },
      ];
      expect(privacyPolicyFromConsents(query({ data }))).toEqual({ status: 'loaded', granted: true, version: '2026-01' });
    });

    it('carregando, com erro ou sem a política na lista', () => {
      expect(privacyPolicyFromConsents(query({ isPending: true }))).toEqual({ status: 'loading' });
      expect(privacyPolicyFromConsents(query({ isError: true }))).toEqual({ status: 'error' });
      expect(privacyPolicyFromConsents(query({ data: [] }))).toEqual({ status: 'loaded', granted: false, version: null });
    });

    it('usa a lista da cópia no aparelho mesmo se a atualização falhar', () => {
      const data = [{ consentType: 'privacy_policy', granted: true, policyVersion: '2026-01' }];
      expect(privacyPolicyFromConsents(query({ isError: true, data }))).toEqual({
        status: 'loaded',
        granted: true,
        version: '2026-01',
      });
    });
  });
});
