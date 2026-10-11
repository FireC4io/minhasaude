import { generateResetCode, hashResetCode, resetCodeMatches } from './password-reset-code';
import { buildPasswordResetEmail } from './password-reset-email';

const SECRET = 's'.repeat(32);

describe('código de recuperar senha', () => {
  it('tem sempre 6 dígitos, inclusive com zeros à esquerda', () => {
    for (let i = 0; i < 500; i++) {
      expect(generateResetCode()).toMatch(/^\d{6}$/);
    }
  });

  it('confere o código certo e recusa o errado', () => {
    const hash = hashResetCode(SECRET, 'conta-1', '012345');
    expect(resetCodeMatches(SECRET, 'conta-1', '012345', hash)).toBe(true);
    expect(resetCodeMatches(SECRET, 'conta-1', '012346', hash)).toBe(false);
  });

  it('o mesmo código não serve para outra conta nem com outro segredo', () => {
    const hash = hashResetCode(SECRET, 'conta-1', '123456');
    expect(resetCodeMatches(SECRET, 'conta-2', '123456', hash)).toBe(false);
    expect(resetCodeMatches('x'.repeat(32), 'conta-1', '123456', hash)).toBe(false);
  });

  it('recusa hash guardado com tamanho diferente sem estourar', () => {
    expect(resetCodeMatches(SECRET, 'conta-1', '123456', 'abcd')).toBe(false);
  });
});

describe('e-mail do código', () => {
  it('traz o código e a validade no texto e no HTML, em português por padrão', () => {
    const mail = buildPasswordResetEmail('a@b.com', '042424', 15);
    expect(mail.to).toBe('a@b.com');
    expect(mail.subject).toBe('Seu código para criar uma senha nova');
    expect(mail.text).toContain('042424');
    expect(mail.text).toContain('15 minutos');
    expect(mail.html).toContain('042424');
  });

  it('muda de idioma', () => {
    expect(buildPasswordResetEmail('a@b.com', '1', 15, 'en').subject).toMatch(/new password/);
    expect(buildPasswordResetEmail('a@b.com', '1', 15, 'es').text).toContain('15 minutos');
  });
});
