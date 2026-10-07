import {
  addDaysToIsoDate,
  formatIsoDateLabel,
  isoDateFromLocal,
  monthGrid,
  todayIsoDate,
  weekOf,
} from './date-utils';

describe('todayIsoDate', () => {
  // Bug real: a versão anterior usava UTC. No Brasil (UTC-3), às 22h de
  // 06/10 o UTC já é 07/10 — o jantar caía no diário do dia seguinte.
  it('usa a data local, não a UTC', () => {
    const lateEvening = new Date(2026, 9, 6, 22, 30); // 06/10, 22h30 local

    expect(todayIsoDate(lateEvening)).toBe('2026-10-06');
  });

  it('formata com zero à esquerda', () => {
    expect(isoDateFromLocal(new Date(2026, 0, 5, 8))).toBe('2026-01-05');
  });
});

describe('addDaysToIsoDate', () => {
  it('atravessa virada de mês e de ano', () => {
    expect(addDaysToIsoDate('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysToIsoDate('2027-01-01', -1)).toBe('2026-12-31');
  });
});

describe('formatIsoDateLabel', () => {
  const now = new Date(2026, 9, 6, 12);

  it('usa Hoje, Ontem e Amanhã perto do dia atual', () => {
    expect(formatIsoDateLabel('2026-10-06', now)).toBe('Hoje');
    expect(formatIsoDateLabel('2026-10-05', now)).toBe('Ontem');
    expect(formatIsoDateLabel('2026-10-07', now)).toBe('Amanhã');
  });

  it('mostra dia e mês por extenso nos outros dias', () => {
    expect(formatIsoDateLabel('2026-09-20', now)).toBe('20 de setembro');
  });
});

describe('weekOf', () => {
  it('devolve domingo a sábado da semana do dia', () => {
    // 06/10/2026 é uma terça-feira.
    expect(weekOf('2026-10-06')).toEqual([
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
    ]);
  });

  it('domingo é o primeiro dia da própria semana', () => {
    expect(weekOf('2026-10-04')[0]).toBe('2026-10-04');
  });
});

describe('monthGrid', () => {
  it('preenche semanas completas, com null fora do mês', () => {
    const grid = monthGrid('2026-10-15');

    // Outubro de 2026 começa numa quinta: 4 vazios antes do dia 1.
    expect(grid[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03']);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
  });
});
