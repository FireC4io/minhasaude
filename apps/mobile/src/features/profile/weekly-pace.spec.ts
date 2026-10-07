import {
  DEFAULT_PACE_OPTION,
  describeGoalTargetPace,
  describeWeeklyPace,
  paceOptionsFor,
  paceOptionToKg,
  paceKgToOption,
} from './weekly-pace';

describe('ritmo semanal', () => {
  it('três opções, com o verbo do objetivo', () => {
    expect(paceOptionsFor('lose').map((o) => o.label)).toEqual([
      'Perder 0,25 kg por semana',
      'Perder 0,5 kg por semana',
      'Perder 0,75 kg por semana',
    ]);
    expect(paceOptionsFor('gain')[0]?.label).toBe('Ganhar 0,25 kg por semana');
  });

  it('em "manter" não há ritmo a escolher', () => {
    expect(paceOptionsFor('maintain')).toEqual([]);
  });

  it('a opção mais leve vem marcada', () => {
    expect(DEFAULT_PACE_OPTION).toBe('0.25');
  });

  it('converte entre a opção da tela e o número da API', () => {
    expect(paceOptionToKg('0.75')).toBe(0.75);
    expect(paceKgToOption('0.50')).toBe('0.5');
    expect(paceKgToOption(null)).toBeNull();
    expect(paceKgToOption('9')).toBeNull();
  });

  it('o texto não promete resultado (RDC 657/2022)', () => {
    const texts = [
      ...paceOptionsFor('lose').map((o) => o.description ?? ''),
      describeWeeklyPace('lose', '0.25', false) ?? '',
    ].join(' ');
    expect(texts).not.toMatch(/garant|vai perder|você perderá|resultado certo/i);
  });

  it('resumo da meta explica o ritmo e a trava do gasto em repouso', () => {
    expect(describeWeeklyPace('lose', '0.50', false)).toBe('Ritmo escolhido: perder 0,5 kg por semana.');
    expect(describeWeeklyPace('lose', '0.75', true)).toMatch(/gasta em repouso/);
    expect(describeWeeklyPace('maintain', null, false)).toBeNull();
  });

  it('frase a partir da meta salva: direção pelo gasto, nada se ajustada à mão', () => {
    const base = { weeklyPaceKg: '0.25', limitedByBmr: false, isManualOverride: false, tdeeKcal: '2500' };
    expect(describeGoalTargetPace({ ...base, targetKcal: '2225' })).toBe(
      'Ritmo escolhido: perder 0,25 kg por semana.',
    );
    expect(describeGoalTargetPace({ ...base, targetKcal: '2775' })).toBe(
      'Ritmo escolhido: ganhar 0,25 kg por semana.',
    );
    expect(describeGoalTargetPace({ ...base, targetKcal: '2000', isManualOverride: true })).toBeNull();
    expect(describeGoalTargetPace({ ...base, weeklyPaceKg: null, targetKcal: '2500' })).toBeNull();
  });
});
