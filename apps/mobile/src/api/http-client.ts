import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { clearStoredTokens, getStoredTokens, setStoredTokens } from './token-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://minhasaude-api.onrender.com';

// Endpoints públicos: um 401 aqui é credencial inválida/refresh token
// expirado de verdade, não motivo pra tentar renovar e repetir a chamada.
const ENDPOINTS_WITHOUT_REFRESH_RETRY = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh'];

// eslint-disable-next-line import/no-named-as-default-member -- axios.create é a API pública normal do axios, não um engano de import.
export const axiosInstance = axios.create({ baseURL: API_BASE_URL });

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean };

let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

axiosInstance.interceptors.request.use(async (config) => {
  const tokens = await getStoredTokens();
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  return config;
});

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

// Compartilhada entre chamadas concorrentes que recebem 401 ao mesmo tempo,
// pra só uma delas de fato chamar /v1/auth/refresh.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
  if (!tokens) {
    throw new Error('Nenhum refresh token armazenado');
  }

  // Via axiosInstance mesmo (não uma instância separada): /v1/auth/refresh
  // está na lista de exceção acima, então não entra em loop com o
  // interceptor de resposta abaixo.
  const { data } = await axiosInstance.post<RefreshResponse>('/v1/auth/refresh', {
    refreshToken: tokens.refreshToken,
  });

  await setStoredTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isExemptEndpoint = ENDPOINTS_WITHOUT_REFRESH_RETRY.some((path) =>
      originalRequest?.url?.includes(path),
    );

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      isExemptEndpoint ||
      originalRequest._retriedAfterRefresh
    ) {
      throw error;
    }

    originalRequest._retriedAfterRefresh = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      await clearStoredTokens();
      onSessionExpired?.();
      throw refreshError;
    }
  },
);

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  axiosInstance(config).then((response) => response.data);
