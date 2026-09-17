import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  it('aplica defaults quando variáveis opcionais estão ausentes', () => {
    const result = validateEnv({});
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(result.CORS_ORIGINS).toEqual([]);
  });

  it('faz parse de CORS_ORIGINS separado por vírgula, ignorando espaços', () => {
    const result = validateEnv({ CORS_ORIGINS: 'http://a.com, http://b.com ,,' });
    expect(result.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
  });

  it('rejeita NODE_ENV inválido', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(/Env inválida/);
  });

  it('rejeita PORT não numérica', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/Env inválida/);
  });
});
