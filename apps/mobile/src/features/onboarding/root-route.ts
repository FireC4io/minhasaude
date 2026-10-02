/**
 * Decide qual grupo de rotas o app deve montar na raiz.
 *
 * Fica fora do componente para a regra de navegação ser testada como função
 * pura, sem montar o roteador.
 */
export type RootRoute = 'auth' | 'app' | 'onboarding' | 'loading' | 'goal-unavailable';

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
    return 'app';
  }

  if (goal.error != null) {
    // Só 404 significa "ainda não tem meta". Qualquer outra falha (rede, CORS,
    // 5xx) não é evidência disso — mandar pro onboarding faria um usuário que
    // já tem meta refazer o consentimento.
    return httpStatusOf(goal.error) === 404 ? 'onboarding' : 'goal-unavailable';
  }

  return 'loading';
}
