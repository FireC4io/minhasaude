import { INPUT_LIMITS } from '@minhasaude/shared';

export type ClientPlatform = 'android' | 'ios' | 'web';

/** Corpo de `POST /v1/client-errors`: só campos técnicos. */
export interface ClientErrorReport {
  message: string;
  stack?: string;
  screen: string;
  appVersion: string;
  platform: ClientPlatform;
  fatal: boolean;
}

export interface ErrorContext {
  screen: string;
  appVersion: string;
  platform: ClientPlatform;
}

interface ErrorReporterOptions {
  /** Desligado em desenvolvimento: lá o próprio Expo mostra o erro. */
  enabled: boolean;
  send: (report: ClientErrorReport) => Promise<void>;
  context: () => ErrorContext;
}

/** Um app travando em loop não pode inundar o log nem gastar a internet da pessoa. */
const MAX_REPORTS_PER_SESSION = 5;

export interface ErrorReporter {
  report(error: unknown, options: { fatal: boolean }): Promise<void>;
}

export function createErrorReporter({ enabled, send, context }: ErrorReporterOptions): ErrorReporter {
  const seen = new Set<string>();

  return {
    async report(error, { fatal }) {
      if (!enabled || seen.size >= MAX_REPORTS_PER_SESSION) return;
      const message = describe(error).slice(0, INPUT_LIMITS.clientErrorMessage);
      if (seen.has(message)) return;
      seen.add(message);

      const stack = error instanceof Error ? error.stack?.slice(0, INPUT_LIMITS.clientErrorStack) : undefined;
      const { screen, appVersion, platform } = context();
      try {
        await send({
          message,
          ...(stack ? { stack } : {}),
          screen: screen.slice(0, INPUT_LIMITS.clientErrorScreen),
          appVersion: appVersion.slice(0, INPUT_LIMITS.appVersion),
          platform,
          fatal,
        });
      } catch {
        // Sem internet ou API fora: o relatório se perde, o app segue.
      }
    },
  };
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return typeof error === 'string' ? error : 'Erro sem descrição';
}
