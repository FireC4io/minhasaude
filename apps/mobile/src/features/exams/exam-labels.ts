import i18n from 'i18next';
import type { DeviceSource, ExamStatus, ExamType } from './types';
import { appLocale } from '@/i18n/format';
import { translatedLabels } from '@/i18n/labels';

export const EXAM_TYPE_LABELS: Record<ExamType, string> = translatedLabels({
  blood_panel: 'exams.types.blood_panel',
  bioimpedance: 'exams.types.bioimpedance',
  other: 'exams.types.other',
});

export const STATUS_LABELS: Record<ExamStatus, string> = translatedLabels({
  pending: 'exams.status.pending',
  processing: 'exams.status.processing',
  extracted: 'exams.status.extracted',
  failed: 'exams.status.failed',
  reviewed: 'exams.status.reviewed',
});

export const DEVICE_LABELS: Record<DeviceSource, string> = translatedLabels({
  inbody: 'exams.devices.inbody',
  tanita: 'exams.devices.tanita',
  omron: 'exams.devices.omron',
  lab_generic: 'exams.devices.lab_generic',
  other: 'exams.devices.other',
});

export function formatExamDate(isoDate: string | null): string {
  if (!isoDate) return i18n.t('exams.noDate');
  return new Date(`${isoDate.slice(0, 10)}T12:00:00`).toLocaleDateString(appLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Valor como o laudo escreveu, com vírgula decimal na tela. */
export function formatExamValue(value: number): string {
  return value.toLocaleString(appLocale(), { maximumFractionDigits: 2 });
}
