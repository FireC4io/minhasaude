import type { ExamDocument, ExamType } from './types';

/** Regra de negócio (CLAUDE.md): 1 envio por tipo de exame a cada 30 dias — controla o custo da IA. */
export const UPLOAD_INTERVAL_DAYS = 30;
const DAY_MS = 86_400_000;

export interface UploadAvailability {
  allowed: boolean;
  /** AAAA-MM-DD a partir do qual pode enviar de novo. */
  nextDate: string | null;
}

export function uploadAvailability(
  documents: readonly Pick<ExamDocument, 'examType' | 'uploadedAt'>[],
  examType: ExamType,
  now: Date = new Date(),
): UploadAvailability {
  const lastUpload = documents
    .filter((document) => document.examType === examType)
    .map((document) => new Date(document.uploadedAt).getTime())
    .sort((a, b) => b - a)[0];

  if (lastUpload === undefined) return { allowed: true, nextDate: null };

  const next = lastUpload + UPLOAD_INTERVAL_DAYS * DAY_MS;
  return next <= now.getTime()
    ? { allowed: true, nextDate: null }
    : { allowed: false, nextDate: new Date(next).toISOString().slice(0, 10) };
}
