import type { CalculatorDefinition } from './types';

export interface MifflinStJeorInputs {
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  ageYears: number;
}

export const mifflinStJeor: CalculatorDefinition<MifflinStJeorInputs, number> = {
  code: 'mifflin_st_jeor',
  version: '1990.1',
  unit: 'kcal/day',
  reference:
    'Mifflin MD, St Jeor ST, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.',
  compute: ({ sex, weightKg, heightCm, ageYears }) => {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    return sex === 'male' ? base + 5 : base - 161;
  },
};
