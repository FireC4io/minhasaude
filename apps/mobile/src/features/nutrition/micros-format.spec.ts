import { formatMicro, partialNote, spokenMicro } from './micros-format';

describe('formatação de micronutrientes', () => {
  it('mostra a unidade e arredonda conforme o tamanho', () => {
    expect(formatMicro('sodiumMg', 1234.56)).toBe('1.235 mg');
    expect(formatMicro('ironMg', 2.58)).toBe('2,6 mg');
    expect(formatMicro('fiberG', 17.02)).toBe('17 g');
    expect(formatMicro('vitaminARaeMcg', 30.4)).toBe('30 mcg');
  });

  it('sem dado não vira zero', () => {
    expect(formatMicro('zincMg', null)).toBe('sem dado');
  });

  it('fala a unidade por extenso para o leitor de tela', () => {
    expect(spokenMicro('ironMg', 2.58)).toBe('Ferro: 2,6 miligramas');
    expect(spokenMicro('vitaminARaeMcg', 30)).toBe('Vitamina A: 30 microgramas');
    expect(spokenMicro('zincMg', null)).toBe('Zinco: sem dado');
  });

  it('avisa quando o total do dia é parcial', () => {
    expect(partialNote({ amount: 10, itemsWithData: 3, items: 5 })).toBe('3 de 5 alimentos têm esse dado');
    expect(partialNote({ amount: 10, itemsWithData: 5, items: 5 })).toBeNull();
    expect(partialNote({ amount: 0, itemsWithData: 0, items: 2 })).toBe('nenhum alimento tem esse dado');
  });
});
