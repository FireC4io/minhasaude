import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import * as generatedAuth from '@/api/generated/endpoints/auth/auth';
import * as tokenStorage from '@/api/token-storage';
import { AuthProvider, useAuth } from './auth-context';

jest.mock('@/api/token-storage');
jest.mock('@/api/generated/endpoints/auth/auth');

function AuthProbe() {
  const { isAuthenticated, isLoading, login, register, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Text testID="isLoading">{String(isLoading)}</Text>
      <Text testID="isAuthenticated">{String(isAuthenticated)}</Text>
      {error ? <Text testID="error">{error}</Text> : null}
      <Pressable
        testID="login"
        onPress={() => {
          setError(null);
          login('user@example.com', 'senha-forte').catch((err: Error) => setError(err.message));
        }}>
        <Text>login</Text>
      </Pressable>
      <Pressable
        testID="loginErrado"
        onPress={() => {
          setError(null);
          login('user@example.com', 'senha-errada').catch((err: Error) => setError(err.message));
        }}>
        <Text>login errado</Text>
      </Pressable>
      <Pressable
        testID="register"
        onPress={() => {
          setError(null);
          register('nova@example.com', 'senha-forte').catch((err: Error) => setError(err.message));
        }}>
        <Text>registrar</Text>
      </Pressable>
      <Pressable testID="logout" onPress={() => void logout()}>
        <Text>sair</Text>
      </Pressable>
    </>
  );
}

function renderAuthProbe() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider', () => {
  const loginMutateAsync = jest.fn();
  const registerMutateAsync = jest.fn();
  const logoutMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(tokenStorage.getStoredTokens).mockResolvedValue(null);
    jest
      .mocked(generatedAuth.useAuthControllerLogin)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({ mutateAsync: loginMutateAsync } as any);
    jest
      .mocked(generatedAuth.useAuthControllerRegister)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({ mutateAsync: registerMutateAsync } as any);
    jest
      .mocked(generatedAuth.useAuthControllerLogout)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({ mutateAsync: logoutMutateAsync } as any);
  });

  it('começa não autenticado sem tokens guardados, e autentica com sucesso no login', async () => {
    loginMutateAsync.mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresInSeconds: 900,
    });

    renderAuthProbe();

    await waitFor(() => expect(screen.getByTestId('isLoading').props.children).toBe('false'));
    expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');

    fireEvent.press(screen.getByTestId('login'));

    await waitFor(() => expect(screen.getByTestId('isAuthenticated').props.children).toBe('true'));
    expect(tokenStorage.setStoredTokens).toHaveBeenCalledWith({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
  });

  it('mantém isAuthenticated false e mostra erro em credencial inválida', async () => {
    loginMutateAsync.mockRejectedValue(new Error('credenciais inválidas'));

    renderAuthProbe();
    await waitFor(() => expect(screen.getByTestId('isLoading').props.children).toBe('false'));

    fireEvent.press(screen.getByTestId('loginErrado'));

    await waitFor(() => expect(screen.getByTestId('error').props.children).toBe('credenciais inválidas'));
    expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
    expect(tokenStorage.setStoredTokens).not.toHaveBeenCalled();
  });

  it('mantém a sessão entre reaberturas quando já existem tokens guardados', async () => {
    jest.mocked(tokenStorage.getStoredTokens).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });

    renderAuthProbe();

    await waitFor(() => expect(screen.getByTestId('isAuthenticated').props.children).toBe('true'));
  });

  it('registra e encadeia o login automaticamente', async () => {
    registerMutateAsync.mockResolvedValue({ id: '1', email: 'nova@example.com', status: 'active' });
    loginMutateAsync.mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      expiresInSeconds: 900,
    });

    renderAuthProbe();
    await waitFor(() => expect(screen.getByTestId('isLoading').props.children).toBe('false'));

    fireEvent.press(screen.getByTestId('register'));

    await waitFor(() => expect(screen.getByTestId('isAuthenticated').props.children).toBe('true'));
    expect(registerMutateAsync).toHaveBeenCalledWith({
      data: { email: 'nova@example.com', password: 'senha-forte' },
    });
  });

  it('logout limpa os tokens e o estado de autenticação', async () => {
    jest.mocked(tokenStorage.getStoredTokens).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    logoutMutateAsync.mockResolvedValue(undefined);

    renderAuthProbe();
    await waitFor(() => expect(screen.getByTestId('isAuthenticated').props.children).toBe('true'));

    fireEvent.press(screen.getByTestId('logout'));

    await waitFor(() => expect(screen.getByTestId('isAuthenticated').props.children).toBe('false'));
    expect(logoutMutateAsync).toHaveBeenCalledWith({ data: { refreshToken: 'refresh-1' } });
    expect(tokenStorage.clearStoredTokens).toHaveBeenCalled();
  });
});
