import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  useAuthControllerLogin,
  useAuthControllerLogout,
  useAuthControllerRegister,
} from '@/api/generated/endpoints/auth/auth';
import { setSessionExpiredHandler } from '@/api/http-client';
import { clearStoredTokens, getStoredTokens, setStoredTokens } from '@/api/token-storage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const loginMutation = useAuthControllerLogin();
  const registerMutation = useAuthControllerRegister();
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
      queryClient.clear();
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  async function login(email: string, password: string) {
    const tokens = await loginMutation.mutateAsync({ data: { email, password } });
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
    queryClient.clear();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
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
