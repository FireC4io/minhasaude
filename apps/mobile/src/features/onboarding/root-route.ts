/**
 * Decide qual grupo de rotas o app deve montar na raiz.
 *
 * Fica fora do componente para a regra de navegação ser testada como função
 * pura, sem montar o roteador.
 */
export type RootRoute = 'auth' | 'app' | 'onboarding' | 'loading' | 'goal-unavailable' | 'policy-update';

/** Último aceite da política de privacidade, como a lista de consentimentos devolve. */
export type PrivacyPolicyState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; granted: boolean; version: string | null };

export interface GoalQueryState {
  isPending: boolean;
  isSuccess: boolean;
  error: unknown;
}

export interface RootRouteInput {
  isAuthenticated: boolean;
  /** Token salvo ainda sendo lido do armazenamento seguro. */
  isRestoringSession?: boolean;
  goal: GoalQueryState;
  privacyPolicy?: PrivacyPolicyState;
  /** Versão da política que o app pede agora (formato AAAA-MM, comparável como texto). */
  currentPolicyVersion?: string;
}

/** Extrai o status HTTP de um erro do axios, que pode vir aninhado ou plano. */
function httpStatusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const { response, status } = error as { response?: { status?: unknown }; status?: unknown };

  if (typeof response?.status === 'number') {
    return response.status;
  }

  return typeof status === 'number' ? status : null;
}

export function resolveRootRoute({
  isAuthenticated,
  isRestoringSession = false,
  goal,
  privacyPolicy,
  currentPolicyVersion,
}: RootRouteInput): RootRoute {
  // Decidir antes de ler a sessão montaria o grupo de auth por um instante, e o
  // redirecionamento descartaria a URL pedida (reload em /weight caía no Diário).
  if (isRestoringSession) {
    return 'loading';
  }

  if (!isAuthenticated) {
    return 'auth';
  }

  if (goal.isSuccess) {
    return routeForPolicy(privacyPolicy, currentPolicyVersion);
  }

  if (goal.error != null) {
    // Só 404 significa "ainda não tem meta". Qualquer outra falha (rede, CORS,
    // 5xx) não é evidência disso — mandar pro onboarding faria um usuário que
    // já tem meta refazer o consentimento.
    return httpStatusOf(goal.error) === 404 ? 'onboarding' : 'goal-unavailable';
  }

  return 'loading';
}

/**
 * Quem aceitou uma versão antiga da política aceita de novo antes de seguir
 * (seção 10 da política). Falha ao ler os consentimentos não trava o app: sem
 * internet, a pessoa continua usando o que já tinha.
 */
function routeForPolicy(policy: PrivacyPolicyState | undefined, current: string | undefined): RootRoute {
  if (!policy || !current) {
    return 'app';
  }
  if (policy.status === 'loading') {
    return 'loading';
  }
  if (policy.status === 'error' || !policy.granted) {
    return 'app';
  }
  return (policy.version ?? '') < current ? 'policy-update' : 'app';
}

interface ConsentsQueryState {
  isPending: boolean;
  isError: boolean;
  /** Corpo de `GET /v1/consents` (o client gerado tipa como `void`). */
  data: unknown;
}

interface ConsentRow {
  consentType: string;
  granted: boolean;
  policyVersion: string | null;
}

export function privacyPolicyFromConsents(query: ConsentsQueryState): PrivacyPolicyState {
  if (query.isPending) return { status: 'loading' };
  if (query.isError || !Array.isArray(query.data)) return { status: 'error' };
  const row = (query.data as ConsentRow[]).find((consent) => consent.consentType === 'privacy_policy');
  return { status: 'loaded', granted: row?.granted ?? false, version: row?.policyVersion ?? null };
}
