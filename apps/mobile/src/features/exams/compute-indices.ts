import { EXAM_INDEX_CALCULATORS, ckdEpi2021 } from '@minhasaude/shared';

import type { ExamDocument } from './types';

type Calculator = (typeof EXAM_INDEX_CALCULATORS)[number];

export interface ComputedIndex {
  calculator: Calculator;
  value: number | null;
  /** Valores confirmados que alimentaram o cálculo (vai para `inputs_used`). */
  inputs: Record<string, number>;
  /** Marcadores que faltam no laudo ou ainda não foram revisados. */
  missing: string[];
}

export interface IndexProfile {
  birthDate: string | null;
  sex: 'male' | 'female' | null;
}

function ageOn(birthDate: string, onDate: string): number {
  const birth = new Date(`${birthDate.slice(0, 10)}T12:00:00`);
  const on = new Date(`${onDate.slice(0, 10)}T12:00:00`);
  const age = on.getFullYear() - birth.getFullYear();
  const hadBirthday =
    on.getMonth() > birth.getMonth() ||
    (on.getMonth() === birth.getMonth() && on.getDate() >= birth.getDate());
  return hadBirthday ? age : age - 1;
}

/**
 * Índices de um laudo. Todos os marcadores de um índice vêm do **mesmo** laudo
 * (glicose e insulina do HOMA-IR precisam ser da mesma coleta), e só valores
 * confirmados pela pessoa entram — `confirmed_at` nulo nunca vai para cálculo.
 */
export function computeIndicesFor(document: ExamDocument, profile: IndexProfile): ComputedIndex[] {
  const confirmed = new Map(
    document.results
      .filter((result) => result.confirmedAt !== null && result.confirmedValue !== null)
      .map((result) => [result.markerCode, result.confirmedValue as number]),
  );

  return EXAM_INDEX_CALCULATORS.map((calculator) => {
    const missing = calculator.requiredMarkers.filter((marker) => !confirmed.has(marker));
    const inputs = Object.fromEntries(
      calculator.requiredMarkers
        .filter((marker) => confirmed.has(marker))
        .map((marker) => [marker, confirmed.get(marker) as number]),
    );

    if (missing.length > 0) return { calculator, value: null, inputs, missing };

    if (calculator.code === ckdEpi2021.code) {
      const date = document.collectedAt ?? document.uploadedAt;
      if (!profile.birthDate || !profile.sex) {
        return { calculator, value: null, inputs, missing: [] };
      }
      const value = ckdEpi2021.compute({
        creatinine: inputs.creatinine as number,
        ageYears: ageOn(profile.birthDate, date),
        sex: profile.sex,
      });
      return { calculator, value, inputs, missing };
    }

    // Os demais recebem exatamente os marcadores que declaram.
    const value = (calculator.compute as (markers: Record<string, number>) => number)(inputs);
    return { calculator, value, inputs, missing };
  });
}
