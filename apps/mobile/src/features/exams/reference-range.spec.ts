import { describePosition, parseReferenceRange, positionInRange } from './reference-range';

describe('parseReferenceRange', () => {
  it.each([
    ['70 a 99', { low: 70, high: 99 }],
    ['70 - 99 mg/dL', { low: 70, high: 99 }],
    ['12,0 a 15,5', { low: 12, high: 15.5 }],
    ['Inferior a 200', { low: null, high: 200 }],
    ['< 150', { low: null, high: 150 }],
    ['Superior a 40', { low: 40, high: null }],
    ['> 40', { low: 40, high: null }],
    ['maior ou igual a 60', { low: 60, high: null }],
  ])('"%s"', (text, expected) => {
    expect(parseReferenceRange(text)).toEqual(expected);
  });

  it('texto que não dá para ler fica sem faixa', () => {
    expect(parseReferenceRange('ver tabela no verso')).toBeNull();
    expect(parseReferenceRange(null)).toBeNull();
  });
});

describe('positionInRange', () => {
  it('compara com a faixa do próprio laudo', () => {
    expect(positionInRange(92, { low: 70, high: 99 })).toBe('within');
    expect(positionInRange(110, { low: 70, high: 99 })).toBe('above');
    expect(positionInRange(60, { low: 70, high: 99 })).toBe('below');
    expect(positionInRange(180, { low: null, high: 200 })).toBe('within');
  });

  it('sem faixa, não compara', () => {
    expect(positionInRange(92, null)).toBe('unknown');
  });
});

describe('describePosition', () => {
  it('é informativo: fala da faixa do laudo, nunca de doença', () => {
    expect(describePosition('above')).toBe('Acima da faixa de referência do laudo');
    expect(describePosition('within')).toBe('Dentro da faixa de referência do laudo');
    expect(describePosition('unknown')).toBe('Sem faixa de referência no laudo');
  });
});
