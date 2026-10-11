import { formatAppVersion } from './app-version';

describe('formatAppVersion', () => {
  it('mostra a versão e o número do build, que identifica o envio à loja', () => {
    expect(formatAppVersion('1.0.0', '2')).toBe('1.0.0 (2)');
  });

  it('sem número de build (web, Expo Go), só a versão', () => {
    expect(formatAppVersion('1.0.0', null)).toBe('1.0.0');
  });

  it('sem versão nenhuma, um traço', () => {
    expect(formatAppVersion(undefined, null)).toBe('—');
  });
});
