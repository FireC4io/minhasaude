import type { DeviceSource, ExamStatus, ExamType } from './types';

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  blood_panel: 'Exame de sangue',
  bioimpedance: 'Bioimpedância',
  other: 'Outro exame',
};

export const STATUS_LABELS: Record<ExamStatus, string> = {
  pending: 'Na fila',
  processing: 'Lendo o exame…',
  extracted: 'Pronto para você revisar',
  failed: 'Não conseguimos ler',
  reviewed: 'Revisado',
};

export const DEVICE_LABELS: Record<DeviceSource, string> = {
  inbody: 'InBody',
  tanita: 'Tanita',
  omron: 'Omron',
  lab_generic: 'Laboratório',
  other: 'Outro aparelho',
};

export function formatExamDate(isoDate: string | null): string {
  if (!isoDate) return 'Data não informada';
  return new Date(`${isoDate.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Valor como o laudo escreveu, com vírgula decimal na tela. */
export function formatExamValue(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
