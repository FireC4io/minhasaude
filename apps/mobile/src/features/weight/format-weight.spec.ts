import { formatKg } from './format-weight';

describe('formatKg', () => {
  it('usa vírgula decimal, como o resto do app em pt-BR', () => {
    expect(formatKg(68.9)).toBe('68,9 kg');
  });

  it('mantém sempre uma casa decimal para a coluna alinhar', () => {
    expect(formatKg(70)).toBe('70,0 kg');
  });

  it('aceita o valor em texto que a API devolve (coluna numeric)', () => {
    expect(formatKg('68.50')).toBe('68,5 kg');
  });
});
