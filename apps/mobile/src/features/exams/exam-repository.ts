import {
  readPreviewValue,
  usePreviewValue,
  writePreviewValue,
} from '@/features/preview/preview-store';

import { DEMO_DOCUMENTS, demoExtraction } from './demo-data';
import type { DeviceSource, ExamDocument, ExamType } from './types';

/**
 * Acesso aos exames (Repository pattern). As telas só conhecem este contrato:
 * quando a API da Fase 5 existir, troca-se a implementação de prévia por uma
 * que chama o client gerado, sem mexer nas telas.
 */
export interface ExamRepository {
  list(): readonly ExamDocument[];
  get(id: string): ExamDocument | undefined;
  upload(input: { examType: ExamType; deviceSource: DeviceSource; fileName: string }): ExamDocument;
  confirm(id: string, confirmations: readonly ResultConfirmation[]): void;
  remove(id: string): void;
}

export interface ResultConfirmation {
  resultId: string;
  value: number;
  unit: string;
}

const DOCUMENTS_KEY = 'exams:documents';
/** Tempo que a "extração" da prévia leva — para a tela de processamento ter o que mostrar. */
export const PREVIEW_EXTRACTION_MS = 4000;

const read = (): readonly ExamDocument[] => readPreviewValue(DOCUMENTS_KEY, DEMO_DOCUMENTS);
const write = (documents: readonly ExamDocument[]) => writePreviewValue(DOCUMENTS_KEY, documents);
const replace = (id: string, update: (document: ExamDocument) => ExamDocument) =>
  write(read().map((document) => (document.id === id ? update(document) : document)));

/** Implementação de prévia: memória do app, dados de demonstração, nada sai do aparelho. */
export const previewExamRepository: ExamRepository = {
  list: read,
  get: (id) => read().find((document) => document.id === id),

  upload({ examType, deviceSource, fileName }) {
    const now = new Date();
    const document: ExamDocument = {
      id: `envio-${now.getTime()}`,
      examType,
      deviceSource,
      status: 'processing',
      uploadedAt: now.toISOString(),
      collectedAt: null,
      labName: null,
      fileName,
      results: [],
    };
    write([document, ...read()]);

    setTimeout(() => {
      const collectedAt = now.toISOString().slice(0, 10);
      replace(document.id, (current) => ({
        ...current,
        status: 'extracted',
        collectedAt,
        labName: examType === 'blood_panel' ? 'Laboratório Exemplo' : null,
        results: examType === 'blood_panel' ? demoExtraction(document.id, collectedAt) : [],
      }));
    }, PREVIEW_EXTRACTION_MS);

    return document;
  },

  confirm(id, confirmations) {
    const confirmedAt = new Date().toISOString();
    const byResult = new Map(
      confirmations.map((confirmation) => [confirmation.resultId, confirmation]),
    );
    replace(id, (document) => ({
      ...document,
      status: 'reviewed',
      // `raw_*` fica como veio do laudo; só os campos `confirmed_*` mudam.
      results: document.results
        .filter((result) => byResult.has(result.id))
        .map((result) => {
          const confirmation = byResult.get(result.id) as ResultConfirmation;
          return {
            ...result,
            confirmedValue: confirmation.value,
            confirmedUnit: confirmation.unit,
            confirmedAt,
          };
        }),
    }));
  },

  remove(id) {
    write(read().filter((document) => document.id !== id));
  },
};

/** Lista reativa: re-renderiza quando a prévia muda (envio, extração, revisão). */
export function useExamDocuments(): readonly ExamDocument[] {
  const [documents] = usePreviewValue(DOCUMENTS_KEY, DEMO_DOCUMENTS);
  return documents;
}

export function useExamDocument(id: string | undefined): ExamDocument | undefined {
  return useExamDocuments().find((document) => document.id === id);
}

const CONSENT_KEY = 'exams:consent';

/**
 * Consentimento específico para dados de exame (LGPD, dado sensível). Na
 * prévia fica só na memória: conceder `exam_data_processing` de verdade na API
 * para uma função que ainda não existe seria registrar um consentimento vazio.
 */
export function useExamConsent(): [boolean, (granted: boolean) => void] {
  return usePreviewValue(CONSENT_KEY, false);
}
