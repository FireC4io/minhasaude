import { brDateToIso, isoToBrDate, maskBrDate } from './br-date';

describe('maskBrDate', () => {
  it.each([
    ['2', '2'],
    ['20', '20'],
    ['205', '20/5'],
    ['2005', '20/05'],
    ['200519', '20/05/19'],
    ['20051996', '20/05/1996'],
    ['200519961', '20/05/1996'],
    ['20/05/1996', '20/05/1996'],
    ['20-05-1996', '20/05/1996'],
    ['', ''],
  ])('%s vira %s', (input, expected) => {
    expect(maskBrDate(input)).toBe(expected);
  });
});

describe('brDateToIso', () => {
  it('converte uma data válida', () => {
    expect(brDateToIso('20/05/1996')).toBe('1996-05-20');
  });

  it.each(['31/02/1996', '00/05/1996', '20/13/1996', '20/05/96', '2/5/1996', ''])(
    'recusa %s',
    (input) => {
      expect(brDateToIso(input)).toBeNull();
    },
  );
});

describe('isoToBrDate', () => {
  it('faz o caminho de volta', () => {
    expect(isoToBrDate('1996-05-20')).toBe('20/05/1996');
  });

  it('devolve vazio para valor ausente ou inválido', () => {
    expect(isoToBrDate(null)).toBe('');
    expect(isoToBrDate('ontem')).toBe('');
  });
});
