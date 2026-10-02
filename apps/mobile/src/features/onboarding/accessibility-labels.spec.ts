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
      'Taxa metabólica basal estimada: 1.600 quilocalorias por dia. ' +
        'Gasto energético total estimado: 2.481 quilocalorias por dia. ' +
        'Meta diária: 2.481 quilocalorias. ' +
        'Proteína: 137 gramas. Gordura: 69 gramas. Carboidrato: 327 gramas.',
    );
  });
});
