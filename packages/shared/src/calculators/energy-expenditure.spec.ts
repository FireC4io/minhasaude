import { mifflinStJeor } from './mifflin-st-jeor';
import { katchMcArdle } from './katch-mcardle';
import { calculateTdee, ACTIVITY_MULTIPLIERS } from './tdee';
import { distributeMacros } from './macros';
import type { ActivityLevel, Goal } from './types';

// Coeficientes conferidos contra Mifflin MD, St Jeor ST, et al. "A new
// predictive equation for resting energy expenditure in healthy
// individuals." Am J Clin Nutr. 1990.
describe('mifflinStJeor', () => {
  it('calcula a TMB para homens (10*peso + 6.25*altura - 5*idade + 5)', () => {
    const bmr = mifflinStJeor.compute({ sex: 'male', weightKg: 70, heightCm: 175, ageYears: 25 });
    expect(bmr).toBeCloseTo(1673.75, 2);
  });

  it('calcula a TMB para mulheres (10*peso + 6.25*altura - 5*idade - 161)', () => {
    const bmr = mifflinStJeor.compute({ sex: 'female', weightKg: 60, heightCm: 165, ageYears: 30 });
    expect(bmr).toBeCloseTo(1320.25, 2);
  });
});

// Fórmula conferida contra Katch FI, McArdle WD. "Introduction to Nutrition,
// Exercise, and Health." BMR = 370 + 21.6 * massa magra (kg).
describe('katchMcArdle', () => {
  it('calcula a TMB a partir do peso e do % de gordura corporal', () => {
    const bmr = katchMcArdle.compute({ weightKg: 80, bodyFatPercent: 15 });
    // LBM = 80 * 0.85 = 68kg -> 370 + 21.6*68 = 1838.8
    expect(bmr).toBeCloseTo(1838.8, 2);
  });

  it('produz uma TMB menor quanto maior o % de gordura, para o mesmo peso', () => {
    const leaner = katchMcArdle.compute({ weightKg: 80, bodyFatPercent: 10 });
    const fatter = katchMcArdle.compute({ weightKg: 80, bodyFatPercent: 30 });
    expect(leaner).toBeGreaterThan(fatter);
  });
});

// Multiplicadores padrão de atividade (Harris-Benedict/Mifflin), consistentes
// com o enum ActivityLevel do perfil (profile.entity.ts).
describe('calculateTdee', () => {
  it.each<[ActivityLevel, number]>([
    ['sedentary', 1.2],
    ['light', 1.375],
    ['moderate', 1.55],
    ['active', 1.725],
    ['very_active', 1.9],
  ])('aplica o multiplicador correto para activity_level=%s', (level, multiplier) => {
    expect(calculateTdee(1673.75, level)).toBeCloseTo(1673.75 * multiplier, 2);
    expect(ACTIVITY_MULTIPLIERS[level]).toBe(multiplier);
  });
});

describe('distributeMacros', () => {
  it.each<Goal>(['lose', 'maintain', 'gain'])(
    'soma das calorias de proteína+gordura+carbo bate com o TDEE para goal=%s',
    (goal) => {
      const result = distributeMacros({ tdeeKcal: 2500, weightKg: 70, goal });
      const totalKcal = result.proteinKcal + result.fatKcal + result.carbKcal;
      expect(totalKcal).toBeCloseTo(2500, 1);
      expect(result.proteinG).toBeGreaterThan(0);
      expect(result.fatG).toBeGreaterThan(0);
      expect(result.carbG).toBeGreaterThan(0);
    },
  );

  it('usa mais proteína por kg no objetivo de emagrecimento do que na manutenção', () => {
    const losing = distributeMacros({ tdeeKcal: 2500, weightKg: 70, goal: 'lose' });
    const maintaining = distributeMacros({ tdeeKcal: 2500, weightKg: 70, goal: 'maintain' });
    expect(losing.proteinG).toBeGreaterThan(maintaining.proteinG);
  });

  it('nunca deixa carboidrato negativo mesmo em TDEE muito baixo para o peso (caso extremo)', () => {
    // 120kg de peso com meta de 1200kcal: proteína (2g/kg) + gordura (27.5%)
    // isoladas excederiam o teto de 85% do TDEE reservado a proteína+gordura,
    // então o resultado precisa escalar essas duas pra caber, garantindo pelo
    // menos 15% do TDEE em carboidrato.
    const result = distributeMacros({ tdeeKcal: 1200, weightKg: 120, goal: 'lose' });
    const totalKcal = result.proteinKcal + result.fatKcal + result.carbKcal;
    expect(result.carbKcal).toBeGreaterThanOrEqual(1200 * 0.15 - 0.01);
    expect(result.carbG).toBeGreaterThan(0);
    expect(totalKcal).toBeCloseTo(1200, 1);
  });
});
