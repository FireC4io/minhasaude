import { changeLanguage } from 'i18next';

import {
  GRAMS,
  OUNCES,
  amountLabel,
  defaultAmount,
  describeAmount,
  entryQuantity,
  gramsOf,
  measureFromEntry,
  measureOption,
  offersOunces,
  shortcutLabel,
  type Measure,
} from './measures';

const tablespoon = { id: 'p-1', kind: 'tablespoon' as const, label: null, grams: '25.00', custom: false };
const mug = { id: 'p-2', kind: null, label: 'minha caneca', grams: '180.00', custom: true };
const spoon: Measure = { type: 'portion', portion: tablespoon };

describe('medidas da tela de quantidade', () => {
  beforeEach(async () => {
    await changeLanguage('pt-BR');
  });

  it('converte para gramas: medida caseira multiplica, onça converte', () => {
    expect(gramsOf(GRAMS, 120)).toBe(120);
    expect(gramsOf(spoon, 2)).toBe(50);
    expect(gramsOf(spoon, 1.5)).toBe(37.5);
    expect(gramsOf(OUNCES, 4)).toBe(113.4);
    expect(gramsOf(spoon, Number.NaN)).toBe(0);
    expect(gramsOf(GRAMS, -1)).toBe(0);
  });

  it('manda medida caseira como porção e onça já em gramas', () => {
    expect(entryQuantity(spoon, 2)).toEqual({ quantity: 2, unit: 'portion', portionId: 'p-1' });
    expect(entryQuantity(OUNCES, 2)).toEqual({ quantity: 56.7, unit: 'grams' });
    expect(entryQuantity(GRAMS, 80)).toEqual({ quantity: 80, unit: 'grams' });
  });

  it('abre a edição na mesma medida em que foi anotado', () => {
    expect(measureFromEntry({ quantity: '2.00', unit: 'portion', portion: tablespoon })).toEqual({
      measure: spoon,
      amount: 2,
    });
    expect(measureFromEntry({ quantity: '150.00', unit: 'grams', portion: null })).toEqual({
      measure: GRAMS,
      amount: 150,
    });
    // Medida apagada no meio do caminho: cai para gramas em vez de quebrar.
    expect(measureFromEntry({ quantity: '2.00', unit: 'portion', portion: null }).measure).toEqual(GRAMS);
  });

  it('descreve a anotação com a medida, no plural certo', () => {
    expect(describeAmount({ quantity: '2.00', unit: 'portion', portion: tablespoon }).text).toBe(
      '2 colheres de sopa (50 g)',
    );
    expect(describeAmount({ quantity: '1.00', unit: 'portion', portion: tablespoon }).text).toBe(
      '1 colher de sopa (25 g)',
    );
    expect(describeAmount({ quantity: '0.50', unit: 'portion', portion: tablespoon }).text).toBe(
      '0,5 colher de sopa (13 g)',
    );
    expect(describeAmount({ quantity: '150.00', unit: 'grams' })).toEqual({ text: '150 g', spoken: '150 gramas' });
    expect(describeAmount({ quantity: '1.00', unit: 'portion', portion: mug }).spoken).toBe(
      '1 minha caneca, 180 gramas',
    );
  });

  it('lista as medidas com o peso para quem quer conferir', () => {
    expect(measureOption(spoon)).toEqual({ label: 'Colher de sopa (25 g)', spoken: 'Colher de sopa, 25 gramas' });
    expect(measureOption({ type: 'portion', portion: mug }).label).toBe('Minha caneca (180 g)');
    expect(measureOption(GRAMS).label).toBe('Gramas');
  });

  it('traduz o nome da medida do sistema', async () => {
    await changeLanguage('es');
    expect(measureOption(spoon).label).toBe('Cucharada (25 g)');
    await changeLanguage('en');
    expect(describeAmount({ quantity: '2.00', unit: 'portion', portion: tablespoon }).text).toBe(
      '2 tablespoons (50 g)',
    );
  });

  it('onça só em inglês', () => {
    expect(offersOunces('en')).toBe(true);
    expect(offersOunces('pt-BR')).toBe(false);
    expect(offersOunces('es')).toBe(false);
  });

  it('atalhos e rótulos acompanham a medida', () => {
    expect(defaultAmount(spoon)).toBe(1);
    expect(defaultAmount(GRAMS)).toBe(100);
    expect(shortcutLabel(spoon, 0.5)).toEqual({ label: '½', spoken: '0,5 colher de sopa' });
    expect(shortcutLabel(spoon, 2).spoken).toBe('2 colheres de sopa');
    expect(shortcutLabel(GRAMS, 50)).toEqual({ label: '50 g', spoken: '50 gramas' });
    expect(amountLabel(spoon)).toBe('Quantas? (colheres de sopa)');
  });
});
