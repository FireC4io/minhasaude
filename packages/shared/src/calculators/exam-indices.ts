import type { CalculatorDefinition } from './types';

/**
 * Índices calculados a partir de exames (Fase 5). Todos usam as unidades
 * canônicas do catálogo de marcadores: mg/dL para glicose, lipídios e
 * creatinina; µU/mL para insulina.
 *
 * São fórmulas públicas da literatura. O app mostra o número, a fórmula e a
 * referência — nunca um rótulo clínico ("resistência à insulina") nem uma
 * recomendação (RDC 657/2022, docs/product-plan.md seção 5).
 *
 * `version` vai para `calculated_metrics.calculator_version`: se uma fórmula
 * for corrigida, a versão muda e o histórico antigo continua auditável.
 */

export interface ExamIndexCalculator<TInputs> extends CalculatorDefinition<TInputs, number> {
  /** Códigos de `exam_marker_catalog` necessários. */
  requiredMarkers: readonly string[];
  /** Nome para a tela. */
  displayName: string;
  /** Fórmula em texto, exibida junto do resultado. */
  formula: string;
  /** Casas decimais para exibir. */
  decimals: number;
}

type Markers<K extends string> = Record<K, number>;

export const homaIr: ExamIndexCalculator<Markers<'glucose_fasting' | 'insulin_fasting'>> = {
  code: 'homa_ir',
  version: '1985.1',
  displayName: 'HOMA-IR',
  unit: '',
  decimals: 2,
  requiredMarkers: ['glucose_fasting', 'insulin_fasting'],
  formula: 'glicose em jejum (mg/dL) × insulina em jejum (µU/mL) ÷ 405',
  reference:
    'Matthews DR, Hosker JP, Rudenski AS, et al. Homeostasis model assessment: insulin resistance and beta-cell function from fasting plasma glucose and insulin concentrations in man. Diabetologia. 1985;28(7):412-419.',
  compute: ({ glucose_fasting, insulin_fasting }) => (glucose_fasting * insulin_fasting) / 405,
};

export const tygIndex: ExamIndexCalculator<Markers<'triglycerides' | 'glucose_fasting'>> = {
  code: 'tyg_index',
  version: '2008.1',
  displayName: 'Índice TyG',
  unit: '',
  decimals: 2,
  requiredMarkers: ['triglycerides', 'glucose_fasting'],
  formula: 'ln(triglicerídeos (mg/dL) × glicose em jejum (mg/dL) ÷ 2)',
  reference:
    'Simental-Mendía LE, Rodríguez-Morán M, Guerrero-Romero F. The product of fasting glucose and triglycerides as surrogate for identifying insulin resistance in apparently healthy subjects. Metab Syndr Relat Disord. 2008;6(4):299-304.',
  compute: ({ triglycerides, glucose_fasting }) => Math.log((triglycerides * glucose_fasting) / 2),
};

const CASTELLI_REFERENCE =
  'Castelli WP, Abbott RD, McNamara PM. Summary estimates of cholesterol used to predict coronary heart disease. Circulation. 1983;67(4):730-734.';

export const castelli1: ExamIndexCalculator<Markers<'total_cholesterol' | 'hdl'>> = {
  code: 'castelli_1',
  version: '1983.1',
  displayName: 'Índice de Castelli I',
  unit: '',
  decimals: 1,
  requiredMarkers: ['total_cholesterol', 'hdl'],
  formula: 'colesterol total ÷ HDL',
  reference: CASTELLI_REFERENCE,
  compute: ({ total_cholesterol, hdl }) => total_cholesterol / hdl,
};

export const castelli2: ExamIndexCalculator<Markers<'ldl' | 'hdl'>> = {
  code: 'castelli_2',
  version: '1983.1',
  displayName: 'Índice de Castelli II',
  unit: '',
  decimals: 1,
  requiredMarkers: ['ldl', 'hdl'],
  formula: 'LDL ÷ HDL',
  reference: CASTELLI_REFERENCE,
  compute: ({ ldl, hdl }) => ldl / hdl,
};

export const nonHdlCholesterol: ExamIndexCalculator<Markers<'total_cholesterol' | 'hdl'>> = {
  code: 'non_hdl_cholesterol',
  version: '2001.1',
  displayName: 'Colesterol não-HDL',
  unit: 'mg/dL',
  decimals: 0,
  requiredMarkers: ['total_cholesterol', 'hdl'],
  formula: 'colesterol total − HDL',
  reference:
    'National Cholesterol Education Program (NCEP). Third Report of the Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults (ATP III). JAMA. 2001;285(19):2486-2497.',
  compute: ({ total_cholesterol, hdl }) => total_cholesterol - hdl,
};

export const tgHdlRatio: ExamIndexCalculator<Markers<'triglycerides' | 'hdl'>> = {
  code: 'tg_hdl_ratio',
  version: '2003.1',
  displayName: 'Relação triglicerídeos/HDL',
  unit: '',
  decimals: 1,
  requiredMarkers: ['triglycerides', 'hdl'],
  formula: 'triglicerídeos ÷ HDL',
  reference:
    'McLaughlin T, Abbasi F, Cheal K, et al. Use of metabolic markers to identify overweight individuals who are insulin resistant. Ann Intern Med. 2003;139(10):802-809.',
  compute: ({ triglycerides, hdl }) => triglycerides / hdl,
};

export interface CkdEpiInputs {
  creatinine: number;
  ageYears: number;
  sex: 'male' | 'female';
}

/** TFG estimada, CKD-EPI 2021 por creatinina — a versão sem variável de raça. */
export const ckdEpi2021: ExamIndexCalculator<CkdEpiInputs> = {
  code: 'ckd_epi_2021',
  version: '2021.1',
  displayName: 'Taxa de filtração glomerular estimada (CKD-EPI 2021)',
  unit: 'mL/min/1,73 m²',
  decimals: 0,
  requiredMarkers: ['creatinine'],
  formula:
    '142 × mín(Cr/κ, 1)^α × máx(Cr/κ, 1)^−1,200 × 0,9938^idade × 1,012 [se mulher]; κ = 0,7 (mulher) ou 0,9 (homem); α = −0,241 (mulher) ou −0,302 (homem)',
  reference:
    'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749.',
  compute: ({ creatinine, ageYears, sex }) => {
    const kappa = sex === 'female' ? 0.7 : 0.9;
    const alpha = sex === 'female' ? -0.241 : -0.302;
    const ratio = creatinine / kappa;
    const value =
      142 *
      Math.min(ratio, 1) ** alpha *
      Math.max(ratio, 1) ** -1.2 *
      0.9938 ** ageYears *
      (sex === 'female' ? 1.012 : 1);
    return value;
  },
};

/** Ordem de exibição na tela de índices. */
export const EXAM_INDEX_CALCULATORS = [
  homaIr,
  tygIndex,
  castelli1,
  castelli2,
  nonHdlCholesterol,
  tgHdlRatio,
  ckdEpi2021,
] as const;
