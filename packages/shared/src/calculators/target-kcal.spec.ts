import {
  DEFAULT_WEEKLY_PACE_KG,
  TARGET_KCAL_VERSION,
  WEEKLY_PACES_KG,
  computeTargetKcal,
} from './target-kcal';

describe('computeTargetKcal', () => {
  const base = { tdeeKcal: 2500, bmrKcal: 1600 };

  it.each([
    [0.25, 2225],
    [0.5, 1950],
    [0.75, 1675],
  ] as const)('perder %s kg/semana tira ~7700 kcal por kg da semana', (pace, expected) => {
    const result = computeTargetKcal({ ...base, goal: 'lose', weeklyPaceKg: pace });
    expect(result.targetKcal).toBe(expected);
    expect(result.limitedByBmr).toBe(false);
  });

  it.each([
    [0.25, 2775],
    [0.5, 3050],
    [0.75, 3325],
  ] as const)('ganhar %s kg/semana soma o mesmo superávit', (pace, expected) => {
    expect(computeTargetKcal({ ...base, goal: 'gain', weeklyPaceKg: pace }).targetKcal).toBe(expected);
  });

  it('manter ignora o ritmo', () => {
    expect(computeTargetKcal({ ...base, goal: 'maintain', weeklyPaceKg: 0.75 }).targetKcal).toBe(2500);
    expect(computeTargetKcal({ ...base, goal: 'maintain', weeklyPaceKg: null }).targetKcal).toBe(2500);
  });

  it('sem ritmo escolhido usa o conservador', () => {
    expect(DEFAULT_WEEKLY_PACE_KG).toBe(0.25);
    expect(computeTargetKcal({ ...base, goal: 'lose', weeklyPaceKg: null }).targetKcal).toBe(2225);
  });

  it('nunca fica abaixo do gasto em repouso, e avisa quando limitou', () => {
    const result = computeTargetKcal({ tdeeKcal: 1700, bmrKcal: 1300, goal: 'lose', weeklyPaceKg: 0.75 });
    expect(result.targetKcal).toBe(1300);
    expect(result.limitedByBmr).toBe(true);
  });

  it('as opções e a versão ficam fixas — histórico grava a versão', () => {
    expect(WEEKLY_PACES_KG).toEqual([0.25, 0.5, 0.75]);
    expect(TARGET_KCAL_VERSION).toBe('2.0.0');
  });
});
