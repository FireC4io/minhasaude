import { resetPreviewStore } from '@/features/preview/preview-store';

import { PREVIEW_EXTRACTION_MS, previewExamRepository as repo } from './exam-repository';

describe('previewExamRepository', () => {
  beforeEach(() => {
    resetPreviewStore();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('começa com os exames de demonstração, já revisados', () => {
    expect(repo.list().length).toBeGreaterThan(0);
    expect(repo.list().every((document) => document.status === 'reviewed')).toBe(true);
  });

  it('envio entra processando e vira "extraído" esperando revisão', () => {
    const sent = repo.upload({
      examType: 'blood_panel',
      deviceSource: 'lab_generic',
      fileName: 'x.pdf',
    });

    expect(repo.get(sent.id)?.status).toBe('processing');
    jest.advanceTimersByTime(PREVIEW_EXTRACTION_MS);

    const extracted = repo.get(sent.id);
    expect(extracted?.status).toBe('extracted');
    expect(extracted?.results.every((result) => result.confirmedAt === null)).toBe(true);
  });

  it('confirmar preenche só os campos confirmados; o valor lido do laudo não muda', () => {
    const sent = repo.upload({
      examType: 'blood_panel',
      deviceSource: 'lab_generic',
      fileName: 'x.pdf',
    });
    jest.advanceTimersByTime(PREVIEW_EXTRACTION_MS);
    const glucose = repo
      .get(sent.id)
      ?.results.find((result) => result.markerCode === 'glucose_fasting');
    if (!glucose) throw new Error('sem glicose na extração');

    repo.confirm(sent.id, [{ resultId: glucose.id, value: 93, unit: 'mg/dL' }]);

    const reviewed = repo.get(sent.id);
    expect(reviewed?.status).toBe('reviewed');
    const confirmed = reviewed?.results.find((result) => result.id === glucose.id);
    expect(confirmed?.rawValue).toBe(glucose.rawValue);
    expect(confirmed?.confirmedValue).toBe(93);
    expect(confirmed?.confirmedAt).not.toBeNull();
  });

  it('resultado desmarcado na revisão não fica no exame', () => {
    const sent = repo.upload({
      examType: 'blood_panel',
      deviceSource: 'lab_generic',
      fileName: 'x.pdf',
    });
    jest.advanceTimersByTime(PREVIEW_EXTRACTION_MS);

    repo.confirm(sent.id, []);

    expect(repo.get(sent.id)?.results).toHaveLength(0);
  });
});
