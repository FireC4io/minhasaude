import { computeIndicesFor } from './compute-indices';
import type { ExamDocument, ExamResult } from './types';

const result = (markerCode: string, value: number, confirmed = true): ExamResult => ({
  id: markerCode,
  markerCode,
  rawValue: String(value),
  rawUnit: 'mg/dL',
  rawReferenceRange: null,
  confirmedValue: confirmed ? value : null,
  confirmedUnit: confirmed ? 'mg/dL' : null,
  confirmedAt: confirmed ? '2026-09-10T12:00:00Z' : null,
});

const doc = (results: ExamResult[]): ExamDocument => ({
  id: 'd1',
  examType: 'blood_panel',
  deviceSource: 'lab_generic',
  status: 'reviewed',
  uploadedAt: '2026-09-10T12:00:00Z',
  collectedAt: '2026-09-08',
  labName: 'Laboratório Exemplo',
  fileName: 'exame.pdf',
  results,
});

const PROFILE = { birthDate: '1990-03-15', sex: 'female' as const };

describe('computeIndicesFor', () => {
  it('calcula quando todos os marcadores do índice estão confirmados no mesmo laudo', () => {
    const indices = computeIndicesFor(
      doc([result('glucose_fasting', 90), result('insulin_fasting', 10)]),
      PROFILE,
    );
    const homa = indices.find((index) => index.calculator.code === 'homa_ir');

    expect(homa?.value).toBeCloseTo(2.22, 2);
    expect(homa?.inputs).toEqual({ glucose_fasting: 90, insulin_fasting: 10 });
    expect(homa?.missing).toEqual([]);
  });

  it('valor não revisado não entra no cálculo', () => {
    const indices = computeIndicesFor(
      doc([result('glucose_fasting', 90), result('insulin_fasting', 10, false)]),
      PROFILE,
    );
    const homa = indices.find((index) => index.calculator.code === 'homa_ir');

    expect(homa?.value).toBeNull();
    expect(homa?.missing).toEqual(['insulin_fasting']);
  });

  it('CKD-EPI usa a idade na data da coleta e o sexo do perfil', () => {
    const indices = computeIndicesFor(doc([result('creatinine', 0.7)]), PROFILE);
    const ckd = indices.find((index) => index.calculator.code === 'ckd_epi_2021');

    // 36 anos em 08/09/2026, mulher, creatinina 0,7 (= κ, então os dois termos valem 1):
    // 142 × 0,9938^36 × 1,012 = 114,9.
    expect(Math.round(ckd?.value ?? 0)).toBe(115);
  });

  it('CKD-EPI sem sexo ou nascimento no perfil não calcula', () => {
    const indices = computeIndicesFor(doc([result('creatinine', 0.7)]), {
      birthDate: null,
      sex: null,
    });

    expect(indices.find((index) => index.calculator.code === 'ckd_epi_2021')?.value).toBeNull();
  });
});
