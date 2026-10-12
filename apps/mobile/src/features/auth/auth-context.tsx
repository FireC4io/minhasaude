import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  useAuthControllerGoogle,
  useAuthControllerLogin,
  useAuthControllerLogout,
  useAuthControllerRegister,
} from '@/api/generated/endpoints/auth/auth';
import { setSessionExpiredHandler } from '@/api/http-client';
import { clearPersistedCache } from '@/api/query-client';
import { pendingStore } from '@/features/offline-queue/offline-queue';
import { clearReminders } from '@/features/reminders/reminder-store';
import { clearStoredTokens, getStoredTokens, setStoredTokens } from '@/api/token-storage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  /** Entra (ou cria a conta) com o ID token do Google. */
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useAuthControllerLogin();
  const registerMutation = useAuthControllerRegister();
  const googleMutation = useAuthControllerGoogle();
  const logoutMutation = useAuthControllerLogout();

  useEffect(() => {
    let mounted = true;
    void getStoredTokens().then((tokens) => {
      if (!mounted) return;
      setIsAuthenticated(tokens !== null);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setIsAuthenticated(false);
      // Inclui a cópia gravada no aparelho: dado de saúde não fica para trás.
      void clearPersistedCache();
      void clearReminders();
      void pendingStore.clear();
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  async function login(email: string, password: string) {
    const tokens = await loginMutation.mutateAsync({ data: { email, password } });
    await setStoredTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    setIsAuthenticated(true);
  }

  async function loginWithGoogle(idToken: string) {
    const tokens = await googleMutation.mutateAsync({ data: { idToken } });
    await setStoredTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    setIsAuthenticated(true);
  }

  async function register(email: string, password: string) {
    await registerMutation.mutateAsync({ data: { email, password } });
    await login(email, password);
  }

  async function logout() {
    const tokens = await getStoredTokens();
    if (tokens) {
      try {
        await logoutMutation.mutateAsync({ data: { refreshToken: tokens.refreshToken } });
      } catch {
        // best-effort: mesmo se a revogação no servidor falhar, a sessão local é encerrada.
      }
    }
    await clearStoredTokens();
    await clearPersistedCache();
    await clearReminders();
    await pendingStore.clear();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
