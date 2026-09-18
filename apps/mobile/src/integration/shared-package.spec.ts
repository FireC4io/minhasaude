import { mifflinStJeor } from '@minhasaude/shared';

describe('@minhasaude/shared no app mobile', () => {
  it('resolve o pacote do workspace e calcula a TMB', () => {
    const tmb = mifflinStJeor.compute({
      sex: 'female',
      weightKg: 68,
      heightCm: 165,
      ageYears: 30,
    });

    expect(Math.round(tmb)).toBe(1400);
  });
});
