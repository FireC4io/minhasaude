/**
 * Decide qual grupo de rotas o app deve montar na raiz.
 *
 * Fica fora do componente de propósito: teste de render de tela é
 * não-confiável neste ambiente (ver CLAUDE.md), então a regra de navegação
 * mora numa função pura com teste unitário.
 */
export type RootRoute = 'auth' | 'app' | 'onboarding' | 'loading' | 'goal-unavailable';

export interface GoalQueryState {
  isPending: boolean;
  isSuccess: boolean;
  error: unknown;
}

export interface RootRouteInput {
  isAuthenticated: boolean;
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

export function resolveRootRoute({ isAuthenticated, goal }: RootRouteInput): RootRoute {
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
