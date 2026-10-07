import { uploadAvailability } from './upload-limit';

const NOW = new Date('2026-10-07T12:00:00Z');
const doc = (examType: 'blood_panel' | 'bioimpedance', uploadedAt: string) =>
  ({ examType, uploadedAt }) as const;

describe('uploadAvailability (1 por tipo a cada 30 dias)', () => {
  it('libera sem envios anteriores do tipo', () => {
    expect(uploadAvailability([], 'blood_panel', NOW)).toEqual({ allowed: true, nextDate: null });
  });

  it('bloqueia dentro dos 30 dias e diz a partir de quando', () => {
    const result = uploadAvailability(
      [doc('blood_panel', '2026-09-20T12:00:00Z')],
      'blood_panel',
      NOW,
    );

    expect(result.allowed).toBe(false);
    expect(result.nextDate).toBe('2026-10-20');
  });

  it('o limite é por tipo de exame', () => {
    const result = uploadAvailability(
      [doc('bioimpedance', '2026-10-01T12:00:00Z')],
      'blood_panel',
      NOW,
    );

    expect(result.allowed).toBe(true);
  });

  it('libera depois dos 30 dias', () => {
    const result = uploadAvailability(
      [doc('blood_panel', '2026-09-01T12:00:00Z')],
      'blood_panel',
      NOW,
    );

    expect(result.allowed).toBe(true);
  });
});
