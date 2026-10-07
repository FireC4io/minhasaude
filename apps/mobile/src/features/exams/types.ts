/**
 * Exames no app, espelhando `docs/database-schema.md` (exam_documents,
 * exam_results). Quando a API da Fase 5 existir, os DTOs gerados pelo orval
 * substituem estes tipos — os nomes já batem com as colunas.
 */

export type ExamType = 'blood_panel' | 'bioimpedance' | 'other';

export type ExamStatus = 'pending' | 'processing' | 'extracted' | 'failed' | 'reviewed';

export type DeviceSource = 'inbody' | 'tanita' | 'omron' | 'lab_generic' | 'other';

export interface ExamResult {
  id: string;
  markerCode: string;
  /** Como veio do laudo. Nunca sobrescrito (CLAUDE.md). */
  rawValue: string;
  rawUnit: string;
  rawReferenceRange: string | null;
  /** Preenchidos só depois da revisão da pessoa; `confirmedAt` nulo = não revisado. */
  confirmedValue: number | null;
  confirmedUnit: string | null;
  confirmedAt: string | null;
}

export interface ExamDocument {
  id: string;
  examType: ExamType;
  deviceSource: DeviceSource | null;
  status: ExamStatus;
  uploadedAt: string;
  /** Data da coleta, como aparece no laudo. */
  collectedAt: string | null;
  labName: string | null;
  fileName: string;
  results: ExamResult[];
}
