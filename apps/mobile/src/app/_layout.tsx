import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, type ErrorBoundaryProps } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { APP_FONTS } from '@/constants/typography';
import { SlowNetworkBanner } from '@/features/network/slow-network-banner';
import { applyThemePreference, loadThemePreference } from '@/features/preferences/theme-preference';
// Importar daqui também inicializa o i18n (efeito do módulo).
import { applyLanguagePreference } from '@/i18n';
import { loadLanguagePreference } from '@/i18n/languages';
import {
  loadOfflineCopyDays,
  offlineCopyMaxAgeMs,
  type OfflineCopyDays,
} from '@/features/preferences/offline-copy-preference';
import {
  queryClient,
  queryPersister,
  shouldPersistQuery,
} from '@/api/query-client';
import { CURRENT_PRIVACY_POLICY_VERSION } from '@minhasaude/shared';
import { useConsentsControllerList } from '@/api/generated/endpoints/consents/consents';
import { useGoalsControllerGetCurrent } from '@/api/generated/endpoints/goals/goals';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import {
  appErrorReporter,
  installGlobalErrorHandler,
  setCurrentScreen,
} from '@/features/errors/app-error-reporter';
import { ErrorScreen } from '@/features/errors/error-screen';
import { GoalUnavailableView } from '@/features/onboarding/goal-unavailable-view';
import { privacyPolicyFromConsents, resolveRootRoute } from '@/features/onboarding/root-route';

// Falha aqui (splash já escondida) não pode derrubar o app: segue sem segurar a splash.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

installGlobalErrorHandler();

/** O expo-router mostra isto no lugar da tela branca quando uma tela quebra ao desenhar. */
export function ErrorBoundary({ error, retry }: Readonly<ErrorBoundaryProps>) {
  return <ErrorScreen error={error} retry={retry} reporter={appErrorReporter} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);
  // O tempo da cópia precisa estar lido antes de restaurá-la: o maxAge só é
  // conferido nesse momento.
  const [offlineCopyDays, setOfflineCopyDays] = useState<OfflineCopyDays | null>(null);
  const isReady = (fontsLoaded || Boolean(fontError)) && offlineCopyDays !== null;

  // A splash nativa (gota Gota Vital) segue na tela enquanto as fontes
  // carregam. Se falharem, o app abre com a fonte do sistema em vez de travar.
  // Tema escolhido em Preferências; sem escolha, segue o aparelho.
  useEffect(() => {
    void loadThemePreference().then(applyThemePreference);
    void loadOfflineCopyDays().then(setOfflineCopyDays);
    void loadLanguagePreference().then(applyLanguagePreference);
  }, []);

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady || offlineCopyDays === null) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: offlineCopyMaxAgeMs(offlineCopyDays),
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* Sem isto, o app instalado (edge-to-edge) deixava hora e bateria
              brancas sobre o fundo claro. Segue o tema do app, não o do aparelho. */}
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
          <SlowNetworkBanner />
        </ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading: isRestoringSession } = useAuth();
  const pathname = usePathname();
  useEffect(() => setCurrentScreen(pathname), [pathname]);
  // 404 = usuário autenticado ainda sem meta calculada -> onboarding. Qualquer
  // outra falha NÃO significa isso (ver resolveRootRoute).
  const goalQuery = useGoalsControllerGetCurrent({ query: { enabled: isAuthenticated, retry: false } });
  // Só quem já usa o app (tem meta) pode estar com aceite antigo da política.
  const consentsQuery = useConsentsControllerList({
    query: { enabled: isAuthenticated && goalQuery.data !== undefined, retry: false },
  });
  const route = resolveRootRoute({
    isAuthenticated,
    isRestoringSession,
    goal: {
      isPending: goalQuery.isPending,
      isSuccess: goalQuery.isSuccess,
      hasData: goalQuery.data !== undefined,
      error: goalQuery.error,
    },
    privacyPolicy: privacyPolicyFromConsents(consentsQuery),
    currentPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
  });

  if (route === 'loading') {
    return null;
  }

  if (route === 'goal-unavailable') {
    return (
      <GoalUnavailableView
        onRetry={() => void goalQuery.refetch()}
        isRetrying={goalQuery.isFetching}
      />
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={route === 'app'}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="diary-entry" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="exam" options={{ headerShown: false }} />
        <Stack.Screen name="quick-add" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="weight-entry" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="water" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="voice-entry" options={{ presentation: 'modal', headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={route === 'policy-update'}>
        <Stack.Screen name="policy-update" options={{ headerShown: false }} />
      </Stack.Protected>
      {/* Conta (baixar dados, apagar, sair) fica aberta também para quem ainda
          não aceitou a política nova: nenhum desses direitos depende do aceite. */}
      <Stack.Protected guard={route === 'app' || route === 'policy-update'}>
        <Stack.Screen name="account" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={route === 'onboarding'}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={route === 'auth'}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      {/* Catálogo de componentes: nunca existe no build de produção. */}
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="dev-catalog" options={{ title: 'Catálogo (dev)' }} />
      </Stack.Protected>
    </Stack>
  );
}
