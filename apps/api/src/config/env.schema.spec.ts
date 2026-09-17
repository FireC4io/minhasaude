import { validateEnv } from './env.schema';

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

describe('validateEnv', () => {
  it('aplica defaults quando variáveis opcionais estão ausentes', () => {
    const result = validateEnv({ DATABASE_URL });
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(result.CORS_ORIGINS).toEqual([]);
  });

  it('faz parse de CORS_ORIGINS separado por vírgula, ignorando espaços', () => {
    const result = validateEnv({ DATABASE_URL, CORS_ORIGINS: 'http://a.com, http://b.com ,,' });
    expect(result.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
  });

  it('rejeita NODE_ENV inválido', () => {
    expect(() => validateEnv({ DATABASE_URL, NODE_ENV: 'staging' })).toThrow(/Env inválida/);
  });

  it('rejeita PORT não numérica', () => {
    expect(() => validateEnv({ DATABASE_URL, PORT: 'abc' })).toThrow(/Env inválida/);
  });

  it('rejeita DATABASE_URL ausente', () => {
    expect(() => validateEnv({})).toThrow(/Env inválida/);
  });
});
