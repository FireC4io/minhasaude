import { resolveLanguage } from './languages';

describe('resolveLanguage', () => {
  it('segue o idioma do celular quando não há escolha', () => {
    expect(resolveLanguage('system', ['en-US'])).toBe('en');
    expect(resolveLanguage('system', ['es-AR', 'pt-BR'])).toBe('es');
    expect(resolveLanguage('system', ['pt-PT'])).toBe('pt-BR');
  });

  it('idioma que o app não tem cai no português', () => {
    expect(resolveLanguage('system', ['fr-FR', 'de-DE'])).toBe('pt-BR');
    expect(resolveLanguage('system', [])).toBe('pt-BR');
  });

  it('usa o primeiro idioma suportado da lista do celular', () => {
    expect(resolveLanguage('system', ['fr-FR', 'es-MX'])).toBe('es');
  });

  it('a escolha da pessoa vence o celular', () => {
    expect(resolveLanguage('en', ['pt-BR'])).toBe('en');
  });
});
