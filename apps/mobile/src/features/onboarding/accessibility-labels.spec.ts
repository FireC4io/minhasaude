import { describeGoal } from './accessibility-labels';

describe('describeGoal', () => {
  it('lê o card de meta por extenso, sem "kcal/dia" nem "g" soletrado', () => {
    expect(
      describeGoal({
        bmrKcal: '1600.40',
        tdeeKcal: '2480.62',
        targetKcal: '2480.62',
        proteinG: '137.2',
        fatG: '68.9',
        carbG: '326.5',
      }),
    ).toBe(
      'Gasto do corpo em repouso: 1.600 quilocalorias por dia. ' +
        'Gasto total do dia, com sua rotina: 2.481 quilocalorias por dia. ' +
        'Meta do dia: 2.481 quilocalorias. ' +
        'Proteínas: 137 gramas. Gorduras: 69 gramas. Carboidratos: 327 gramas.',
    );
  });
});
