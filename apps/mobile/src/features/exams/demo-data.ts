import type { ExamDocument, ExamResult } from './types';

/**
 * Exames de demonstração para as telas em prévia. **Valores inventados**, de
 * uma pessoa fictícia — nada vem de exame real.
 */

const result = (
  documentId: string,
  markerCode: string,
  value: string,
  unit: string,
  reference: string | null,
  confirmedAt: string | null,
): ExamResult => ({
  id: `${documentId}-${markerCode}`,
  markerCode,
  rawValue: value,
  rawUnit: unit,
  rawReferenceRange: reference,
  confirmedValue: confirmedAt ? Number(value.replace(',', '.')) : null,
  confirmedUnit: confirmedAt ? unit : null,
  confirmedAt,
});

function bloodPanel(
  id: string,
  collectedAt: string,
  values: Record<string, string>,
  confirmedAt: string | null,
): ExamDocument {
  const r = (code: string, unit: string, reference: string | null) =>
    values[code] ? [result(id, code, values[code], unit, reference, confirmedAt)] : [];
  return {
    id,
    examType: 'blood_panel',
    deviceSource: 'lab_generic',
    status: confirmedAt ? 'reviewed' : 'extracted',
    uploadedAt: `${collectedAt}T15:00:00Z`,
    collectedAt,
    labName: 'Laboratório Exemplo',
    fileName: `exame-${collectedAt}.pdf`,
    results: [
      ...r('glucose_fasting', 'mg/dL', '70 a 99'),
      ...r('insulin_fasting', 'µU/mL', '2,6 a 24,9'),
      ...r('hba1c', '%', 'Inferior a 5,7'),
      ...r('total_cholesterol', 'mg/dL', 'Inferior a 190'),
      ...r('hdl', 'mg/dL', 'Superior a 40'),
      ...r('ldl', 'mg/dL', 'Inferior a 130'),
      ...r('triglycerides', 'mg/dL', 'Inferior a 150'),
      ...r('creatinine', 'mg/dL', '0,5 a 1,1'),
      ...r('hemoglobin', 'g/dL', '12,0 a 15,5'),
    ],
  };
}

export const DEMO_DOCUMENTS: readonly ExamDocument[] = [
  bloodPanel(
    'demo-2026-08',
    '2026-08-20',
    {
      glucose_fasting: '94',
      insulin_fasting: '8,2',
      hba1c: '5,4',
      total_cholesterol: '182',
      hdl: '52',
      ldl: '108',
      triglycerides: '118',
      creatinine: '0,8',
      hemoglobin: '13,6',
    },
    '2026-08-21T10:00:00Z',
  ),
  bloodPanel(
    'demo-2026-02',
    '2026-02-14',
    {
      glucose_fasting: '101',
      insulin_fasting: '11,4',
      total_cholesterol: '205',
      hdl: '47',
      ldl: '131',
      triglycerides: '162',
      creatinine: '0,8',
      hemoglobin: '13,1',
    },
    '2026-02-15T10:00:00Z',
  ),
];

/** O que a "extração" da prévia devolve para um exame de sangue novo — fica para a pessoa revisar. */
export function demoExtraction(documentId: string, collectedAt: string): ExamResult[] {
  return bloodPanel(
    documentId,
    collectedAt,
    {
      glucose_fasting: '96',
      insulin_fasting: '9,0',
      total_cholesterol: '188',
      hdl: '54',
      ldl: '112',
      triglycerides: '121',
      creatinine: '0,8',
    },
    null,
  ).results;
}

export interface BioimpedanceMeasurement {
  id: string;
  measuredAt: string;
  source: 'inbody' | 'tanita' | 'omron' | 'other';
  weightKg: number;
  bodyFatPercent: number | null;
  muscleMassKg: number | null;
}

/** Bioimpedância de dois aparelhos diferentes — que a tela nunca compara entre si. */
export const DEMO_BIOIMPEDANCE: readonly BioimpedanceMeasurement[] = [
  {
    id: 'b1',
    measuredAt: '2026-04-02',
    source: 'inbody',
    weightKg: 64.1,
    bodyFatPercent: 29.8,
    muscleMassKg: 24.1,
  },
  {
    id: 'b2',
    measuredAt: '2026-06-05',
    source: 'inbody',
    weightKg: 63.2,
    bodyFatPercent: 28.9,
    muscleMassKg: 24.3,
  },
  {
    id: 'b3',
    measuredAt: '2026-08-30',
    source: 'inbody',
    weightKg: 62.6,
    bodyFatPercent: 28.1,
    muscleMassKg: 24.4,
  },
  {
    id: 'b4',
    measuredAt: '2026-07-14',
    source: 'tanita',
    weightKg: 62.9,
    bodyFatPercent: 31.2,
    muscleMassKg: 22.8,
  },
  {
    id: 'b5',
    measuredAt: '2026-09-20',
    source: 'tanita',
    weightKg: 62.2,
    bodyFatPercent: 30.6,
    muscleMassKg: 22.9,
  },
];
