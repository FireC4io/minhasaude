import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { queryClient } from '@/api/query-client';
import { useGoalsControllerGetCurrent } from '@/api/generated/endpoints/goals/goals';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';

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
  // 404 = usuário autenticado ainda sem meta calculada -> onboarding.
  const goalQuery = useGoalsControllerGetCurrent({ query: { enabled: isAuthenticated, retry: false } });
  const hasActiveGoal = goalQuery.isSuccess;
  const isCheckingOnboarding = isAuthenticated && goalQuery.isPending;

  if (isCheckingOnboarding) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={isAuthenticated && hasActiveGoal}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="diary-entry" options={{ presentation: 'modal', headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated && !hasActiveGoal}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
