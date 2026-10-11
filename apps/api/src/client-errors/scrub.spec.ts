import { scrub } from './scrub';

describe('scrub', () => {
  it('troca e-mails por [email]', () => {
    expect(scrub('falha ao entrar com maria.silva@exemplo.com.br')).toBe('falha ao entrar com [email]');
  });

  it('troca tokens JWT por [token]', () => {
    expect(scrub('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc_DEF-123')).toBe('Bearer [token]');
  });

  it('não mexe no resto da mensagem', () => {
    const message = "TypeError: Cannot read property 'kcal' of undefined";
    expect(scrub(message)).toBe(message);
  });
});
