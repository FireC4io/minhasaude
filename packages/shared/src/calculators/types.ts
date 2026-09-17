export interface CalculatorDefinition<TInputs, TResult> {
  code: string;
  version: string;
  unit: string;
  reference: string;
  compute: (inputs: TInputs) => TResult;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type Goal = 'lose' | 'maintain' | 'gain';
