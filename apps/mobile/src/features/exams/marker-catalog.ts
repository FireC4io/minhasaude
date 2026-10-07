/**
 * Catálogo de marcadores no app (espelha `exam_marker_catalog`). A explicação
 * diz o que o exame mede, em linguagem simples — nunca o que um valor
 * "significa" para a pessoa nem o que fazer com ele (RDC 657/2022).
 */

export type MarkerCategory = 'metabolic' | 'lipid' | 'renal' | 'blood' | 'body_composition';

export interface MarkerInfo {
  code: string;
  displayName: string;
  category: MarkerCategory;
  canonicalUnit: string;
  whatItMeasures: string;
}

const MARKERS: readonly MarkerInfo[] = [
  {
    code: 'glucose_fasting',
    displayName: 'Glicose em jejum',
    category: 'metabolic',
    canonicalUnit: 'mg/dL',
    whatItMeasures: 'A quantidade de açúcar (glicose) no sangue depois de algumas horas sem comer.',
  },
  {
    code: 'insulin_fasting',
    displayName: 'Insulina em jejum',
    category: 'metabolic',
    canonicalUnit: 'µU/mL',
    whatItMeasures: 'O hormônio que ajuda a glicose a entrar nas células, medido em jejum.',
  },
  {
    code: 'hba1c',
    displayName: 'Hemoglobina glicada (HbA1c)',
    category: 'metabolic',
    canonicalUnit: '%',
    whatItMeasures: 'Uma média aproximada da glicose no sangue nos últimos meses.',
  },
  {
    code: 'total_cholesterol',
    displayName: 'Colesterol total',
    category: 'lipid',
    canonicalUnit: 'mg/dL',
    whatItMeasures: 'A soma das formas de colesterol que circulam no sangue.',
  },
  {
    code: 'hdl',
    displayName: 'Colesterol HDL',
    category: 'lipid',
    canonicalUnit: 'mg/dL',
    whatItMeasures: 'A parte do colesterol transportada pelas lipoproteínas de alta densidade.',
  },
  {
    code: 'ldl',
    displayName: 'Colesterol LDL',
    category: 'lipid',
    canonicalUnit: 'mg/dL',
    whatItMeasures: 'A parte do colesterol transportada pelas lipoproteínas de baixa densidade.',
  },
  {
    code: 'triglycerides',
    displayName: 'Triglicerídeos',
    category: 'lipid',
    canonicalUnit: 'mg/dL',
    whatItMeasures: 'Um tipo de gordura que circula no sangue.',
  },
  {
    code: 'creatinine',
    displayName: 'Creatinina',
    category: 'renal',
    canonicalUnit: 'mg/dL',
    whatItMeasures: 'Uma substância produzida pelos músculos e eliminada pelos rins.',
  },
  {
    code: 'hemoglobin',
    displayName: 'Hemoglobina',
    category: 'blood',
    canonicalUnit: 'g/dL',
    whatItMeasures: 'A proteína dos glóbulos vermelhos que leva oxigênio pelo corpo.',
  },
];

export const CATEGORY_LABELS: Record<MarkerCategory, string> = {
  metabolic: 'Glicose e insulina',
  lipid: 'Colesterol e gorduras',
  renal: 'Rins',
  blood: 'Sangue',
  body_composition: 'Composição corporal',
};

export const CATEGORY_ORDER: readonly MarkerCategory[] = [
  'metabolic',
  'lipid',
  'renal',
  'blood',
  'body_composition',
];

const BY_CODE = new Map(MARKERS.map((marker) => [marker.code, marker]));

/** Marcador fora do catálogo ainda aparece, com o próprio código como nome. */
export function markerInfo(code: string): MarkerInfo {
  return (
    BY_CODE.get(code) ?? {
      code,
      displayName: code,
      category: 'blood',
      canonicalUnit: '',
      whatItMeasures: '',
    }
  );
}

export const ALL_MARKERS = MARKERS;
