import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/api/http-client';
import { formatAppVersion } from '@/features/account/app-version';

import { createErrorReporter, type ClientPlatform } from './error-reporter';

const SEND_TIMEOUT_MS = 10_000;
let currentScreen = '/';

/** Atualizado pelo layout raiz a cada troca de tela: diz onde o erro aconteceu. */
export function setCurrentScreen(pathname: string): void {
  currentScreen = pathname;
}

function platform(): ClientPlatform {
  if (Platform.OS === 'ios' || Platform.OS === 'web') return Platform.OS;
  return 'android';
}

/** Só no build de produção; em desenvolvimento o Expo já mostra o erro na tela. */
export const appErrorReporter = createErrorReporter({
  enabled: !__DEV__,
  async send(report) {
    // fetch direto, sem o client do axios: um erro no client não pode impedir o relatório.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      await fetch(`${API_BASE_URL}/v1/client-errors`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(report),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  },
  context: () => ({
    screen: currentScreen,
    appVersion: formatAppVersion(Constants.expoConfig?.version, Application.nativeBuildVersion),
    platform: platform(),
  }),
});

interface ErrorUtilsGlobal {
  getGlobalHandler(): (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: unknown, isFatal?: boolean) => void): void;
}

let installed = false;

/** Erros fora da renderização (eventos, timers): relata e segue o caminho padrão. */
export function installGlobalErrorHandler(): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsGlobal }).ErrorUtils;
  if (installed || !errorUtils) return;
  installed = true;
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    void appErrorReporter.report(error, { fatal: Boolean(isFatal) });
    previous(error, isFatal);
  });
}
