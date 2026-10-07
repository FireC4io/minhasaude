import { sumMicros } from '@minhasaude/shared';
import { weeklyAverage } from './weekly-summary';

const day = (kcal: number, logged = true) => ({
  date: 'x',
  // Só a presença de uma entrada importa para a média.
  meals: { breakfast: logged ? [{} as never] : [], lunch: [], dinner: [], snack: [] },
  summary: {
    consumed: { kcal, proteinG: kcal / 20, fatG: kcal / 40, carbG: kcal / 8 },
    target: { kcal: 2000, proteinG: 100, fatG: 60, carbG: 250 },
    remaining: null,
    micros: sumMicros([]),
  },
});

describe('weeklyAverage', () => {
  it('faz a média só dos dias com registro — dia vazio não puxa a média para baixo', () => {
    const result = weeklyAverage([day(1800), day(2200), day(0, false), undefined]);

    expect(result.daysLogged).toBe(2);
    expect(result.average?.kcal).toBe(2000);
    expect(result.average?.proteinG).toBe(100);
  });

  it('sem nenhum dia registrado, não há média', () => {
    expect(weeklyAverage([day(0, false), undefined]).average).toBeNull();
  });

  it('usa a meta mais recente da semana', () => {
    expect(weeklyAverage([day(1800)]).target?.kcal).toBe(2000);
  });
});
