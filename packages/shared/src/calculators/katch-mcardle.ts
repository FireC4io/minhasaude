import type { CalculatorDefinition } from './types';

export interface KatchMcArdleInputs {
  weightKg: number;
  bodyFatPercent: number;
}

export const katchMcArdle: CalculatorDefinition<KatchMcArdleInputs, number> = {
  code: 'katch_mcardle',
  version: '1996.1',
  unit: 'kcal/day',
  reference: 'Katch FI, McArdle WD. Introduction to Nutrition, Exercise, and Health. 1996.',
  compute: ({ weightKg, bodyFatPercent }) => {
    const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
    return 370 + 21.6 * leanMassKg;
  },
};
