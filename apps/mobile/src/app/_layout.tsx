import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { queryClient } from '@/api/query-client';
import { useGoalsControllerGetCurrent } from '@/api/generated/endpoints/goals/goals';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { GoalUnavailableView } from '@/features/onboarding/goal-unavailable-view';
import { resolveRootRoute } from '@/features/onboarding/root-route';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();
  // 404 = usuário autenticado ainda sem meta calculada -> onboarding. Qualquer
  // outra falha NÃO significa isso (ver resolveRootRoute).
  const goalQuery = useGoalsControllerGetCurrent({ query: { enabled: isAuthenticated, retry: false } });
  const route = resolveRootRoute({
    isAuthenticated,
    goal: { isPending: goalQuery.isPending, isSuccess: goalQuery.isSuccess, error: goalQuery.error },
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
      </Stack.Protected>
      <Stack.Protected guard={route === 'onboarding'}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={route === 'auth'}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
