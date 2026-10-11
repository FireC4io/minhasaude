import { changeLanguage } from 'i18next';

import { displayNumber, spokenKg } from '@/features/accessibility/spoken-format';

describe('formatação segue o idioma', () => {
  afterEach(async () => {
    await changeLanguage('pt-BR');
  });

  it('português: vírgula decimal e singular até 2', () => {
    expect(displayNumber(2.5)).toBe('2,5');
    expect(spokenKg(1.5)).toBe('1,5 quilo');
  });

  it('inglês: ponto decimal e plural fora do 1', async () => {
    await changeLanguage('en');
    expect(displayNumber(2.5)).toBe('2.5');
    expect(spokenKg(1.5)).toBe('1.5 kilos');
    expect(spokenKg(1)).toBe('1 kilo');
  });

  it('espanhol: vírgula decimal e unidade traduzida', async () => {
    await changeLanguage('es');
    expect(displayNumber(2.5)).toBe('2,5');
    expect(spokenKg(68.5)).toBe('68,5 kilos');
  });
});
