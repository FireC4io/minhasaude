import i18n from 'i18next';

import { translatedLabels } from '@/i18n/labels';

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

type KnownMarker =
  | 'glucose_fasting'
  | 'insulin_fasting'
  | 'hba1c'
  | 'total_cholesterol'
  | 'hdl'
  | 'ldl'
  | 'triglycerides'
  | 'creatinine'
  | 'hemoglobin';

// Nome e explicação lidos na hora (getters), no idioma em uso.
function marker(code: KnownMarker, category: MarkerCategory, canonicalUnit: string): MarkerInfo {
  return {
    code,
    category,
    canonicalUnit,
    get displayName() {
      return i18n.t(`exams.markers.${code}.name`);
    },
    get whatItMeasures() {
      return i18n.t(`exams.markers.${code}.what`);
    },
  };
}

const MARKERS: readonly MarkerInfo[] = [
  marker('glucose_fasting', 'metabolic', 'mg/dL'),
  marker('insulin_fasting', 'metabolic', 'µU/mL'),
  marker('hba1c', 'metabolic', '%'),
  marker('total_cholesterol', 'lipid', 'mg/dL'),
  marker('hdl', 'lipid', 'mg/dL'),
  marker('ldl', 'lipid', 'mg/dL'),
  marker('triglycerides', 'lipid', 'mg/dL'),
  marker('creatinine', 'renal', 'mg/dL'),
  marker('hemoglobin', 'blood', 'g/dL'),
];

export const CATEGORY_LABELS: Record<MarkerCategory, string> = translatedLabels({
  metabolic: 'exams.categories.metabolic',
  lipid: 'exams.categories.lipid',
  renal: 'exams.categories.renal',
  blood: 'exams.categories.blood',
  body_composition: 'exams.categories.body_composition',
});

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
