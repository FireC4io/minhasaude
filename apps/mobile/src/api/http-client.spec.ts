import MockAdapter from 'axios-mock-adapter';
import { axiosInstance, customInstance, setSessionExpiredHandler } from './http-client';
import * as tokenStorage from './token-storage';

jest.mock('./token-storage');

describe('http-client', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
    setSessionExpiredHandler(null);
  });

  it('anexa o access token armazenado no header Authorization', async () => {
    jest.mocked(tokenStorage.getStoredTokens).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    mock.onGet('/v1/me').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer access-1');
      return [200, { ok: true }];
    });

    await customInstance({ url: '/v1/me', method: 'GET' });
  });

  it('renova o access token automaticamente após um 401 e repete a chamada original', async () => {
    jest.mocked(tokenStorage.getStoredTokens).mockResolvedValue({
      accessToken: 'access-expirado',
      refreshToken: 'refresh-1',
    });

    let firstAttempt = true;
    mock.onGet('/v1/me').reply(() => {
      if (firstAttempt) {
        firstAttempt = false;
        return [401];
      }
      return [200, { ok: true }];
    });
    mock.onPost('/v1/auth/refresh').reply(200, {
      accessToken: 'access-novo',
      refreshToken: 'refresh-novo',
      expiresInSeconds: 900,
    });

    const result = await customInstance<{ ok: boolean }>({ url: '/v1/me', method: 'GET' });

    expect(result).toEqual({ ok: true });
    expect(tokenStorage.setStoredTokens).toHaveBeenCalledWith({
      accessToken: 'access-novo',
      refreshToken: 'refresh-novo',
    });
  });

  it('limpa a sessão e chama o handler de sessão expirada quando o refresh também falha', async () => {
    jest.mocked(tokenStorage.getStoredTokens).mockResolvedValue({
      accessToken: 'access-expirado',
      refreshToken: 'refresh-invalido',
    });
    const onSessionExpired = jest.fn();
    setSessionExpiredHandler(onSessionExpired);

    mock.onGet('/v1/me').reply(401);
    mock.onPost('/v1/auth/refresh').reply(401);

    await expect(customInstance({ url: '/v1/me', method: 'GET' })).rejects.toBeDefined();
    expect(tokenStorage.clearStoredTokens).toHaveBeenCalled();
    expect(onSessionExpired).toHaveBeenCalled();
  });

  it('não tenta renovar quando o 401 vem do próprio /v1/auth/login', async () => {
    jest.mocked(tokenStorage.getStoredTokens).mockResolvedValue(null);
    mock.onPost('/v1/auth/login').reply(401);

    await expect(
      customInstance({ url: '/v1/auth/login', method: 'POST', data: {} }),
    ).rejects.toBeDefined();
    expect(mock.history.post?.filter((request) => request.url === '/v1/auth/refresh')).toHaveLength(
      0,
    );
  });
});
