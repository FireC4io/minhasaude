import { databaseSsl } from './database-ssl';

describe('databaseSsl', () => {
  it('disable: conexão sem TLS (só banco local)', () => {
    expect(databaseSsl('disable')).toBe(false);
  });

  it('require: cifra, mas sem conferir o certificado', () => {
    expect(databaseSsl('require')).toEqual({ rejectUnauthorized: false });
  });

  it('verify-full: cifra e confere o certificado contra a autoridade informada', () => {
    expect(databaseSsl('verify-full', 'PEM')).toEqual({ rejectUnauthorized: true, ca: 'PEM' });
  });
});
