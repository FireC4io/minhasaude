import { validateEnv } from './env.schema';

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
const JWT_ACCESS_SECRET = 'a'.repeat(32);
const base = { DATABASE_URL, JWT_ACCESS_SECRET };

describe('validateEnv', () => {
  it('aplica defaults quando variáveis opcionais estão ausentes', () => {
    const result = validateEnv(base);
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(result.CORS_ORIGINS).toEqual([]);
    expect(result.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(result.REFRESH_TOKEN_TTL_DAYS).toBe(30);
    expect(result.TRUST_PROXY_HOPS).toBe(0);
  });

  it('aceita a quantidade de proxies confiáveis e recusa valores fora da faixa', () => {
    expect(validateEnv({ ...base, TRUST_PROXY_HOPS: '1' }).TRUST_PROXY_HOPS).toBe(1);
    expect(() => validateEnv({ ...base, TRUST_PROXY_HOPS: '-1' })).toThrow(/Env inválida/);
    expect(() => validateEnv({ ...base, TRUST_PROXY_HOPS: 'true' })).toThrow(/Env inválida/);
  });

  it('faz parse de CORS_ORIGINS separado por vírgula, ignorando espaços', () => {
    const result = validateEnv({ ...base, CORS_ORIGINS: 'http://a.com, http://b.com ,,' });
    expect(result.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
  });

  it('rejeita NODE_ENV inválido', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'staging' })).toThrow(/Env inválida/);
  });

  it('rejeita PORT não numérica', () => {
    expect(() => validateEnv({ ...base, PORT: 'abc' })).toThrow(/Env inválida/);
  });

  it('rejeita DATABASE_URL ausente', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET })).toThrow(/Env inválida/);
  });

  it('rejeita JWT_ACCESS_SECRET curto demais', () => {
    expect(() => validateEnv({ DATABASE_URL, JWT_ACCESS_SECRET: 'curto' })).toThrow(
      /Env inválida/,
    );
  });
});
