import type { Goal } from './types';

export interface DistributeMacrosInputs {
  tdeeKcal: number;
  weightKg: number;
  goal: Goal;
}

export interface MacroDistribution {
  proteinG: number;
  fatG: number;
  carbG: number;
  proteinKcal: number;
  fatKcal: number;
  carbKcal: number;
}

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_FAT = 9;
const KCAL_PER_G_CARB = 4;

// Proteína alvo por kg de peso corporal, população geral (não atleta em
// treino de força) - ver ISSN Position Stand: protein and exercise (2017),
// faixa de manutenção de massa magra 1.4-2.0 g/kg/d.
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  maintain: 1.6,
  gain: 1.8,
};

// Gordura como % fixo do TDEE - dentro da AMDR (Dietary Reference Intakes)
// de 20-35% das calorias totais.
const FAT_PERCENT_OF_TDEE = 0.275;

// Piso de carboidrato: garante que proteína+gordura nunca consumam mais que
// 85% do TDEE, mesmo em combinações extremas de peso alto + meta muito
// agressiva de déficit calórico - sem isso, carboidrato pode virar negativo.
const MAX_PROTEIN_PLUS_FAT_SHARE = 0.85;

export function distributeMacros({ tdeeKcal, weightKg, goal }: DistributeMacrosInputs): MacroDistribution {
  const proteinG = PROTEIN_G_PER_KG[goal] * weightKg;
  let proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  let fatKcal = tdeeKcal * FAT_PERCENT_OF_TDEE;

  const proteinPlusFatCap = tdeeKcal * MAX_PROTEIN_PLUS_FAT_SHARE;
  const proteinPlusFatKcal = proteinKcal + fatKcal;
  if (proteinPlusFatKcal > proteinPlusFatCap) {
    const scale = proteinPlusFatCap / proteinPlusFatKcal;
    proteinKcal *= scale;
    fatKcal *= scale;
  }

  const carbKcal = tdeeKcal - proteinKcal - fatKcal;

  return {
    proteinG: proteinKcal / KCAL_PER_G_PROTEIN,
    fatG: fatKcal / KCAL_PER_G_FAT,
    carbG: carbKcal / KCAL_PER_G_CARB,
    proteinKcal,
    fatKcal,
    carbKcal,
  };
}
