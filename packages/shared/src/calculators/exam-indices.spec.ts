import {
  castelli1,
  castelli2,
  ckdEpi2021,
  EXAM_INDEX_CALCULATORS,
  homaIr,
  nonHdlCholesterol,
  tgHdlRatio,
  tygIndex,
} from './exam-indices';

describe('HOMA-IR', () => {
  it('glicose × insulina / 405 (Matthews, 1985)', () => {
    expect(homaIr.compute({ glucose_fasting: 90, insulin_fasting: 10 })).toBeCloseTo(2.222, 3);
  });
});

describe('índice TyG', () => {
  it('ln(triglicerídeos × glicose / 2) (Simental-Mendía, 2008)', () => {
    expect(tygIndex.compute({ triglycerides: 150, glucose_fasting: 100 })).toBeCloseTo(8.9227, 4);
  });
});

describe('Castelli I e II, não-HDL, TG/HDL', () => {
  const lipids = { total_cholesterol: 200, hdl: 50, ldl: 130, triglycerides: 150 };

  it('Castelli I = colesterol total / HDL', () => {
    expect(castelli1.compute(lipids)).toBe(4);
  });

  it('Castelli II = LDL / HDL', () => {
    expect(castelli2.compute(lipids)).toBeCloseTo(2.6, 5);
  });

  it('colesterol não-HDL = total − HDL', () => {
    expect(nonHdlCholesterol.compute(lipids)).toBe(150);
  });

  it('relação triglicerídeos / HDL', () => {
    expect(tgHdlRatio.compute(lipids)).toBe(3);
  });
});

describe('CKD-EPI 2021 (creatinina, sem variável de raça)', () => {
  it('homem, 60 anos, creatinina 1,0 mg/dL → 86 (confere com a calculadora da NKF)', () => {
    expect(Math.round(ckdEpi2021.compute({ creatinine: 1.0, ageYears: 60, sex: 'male' }))).toBe(86);
  });

  it('mulher, 50 anos, creatinina 0,7 mg/dL → 105', () => {
    expect(Math.round(ckdEpi2021.compute({ creatinine: 0.7, ageYears: 50, sex: 'female' }))).toBe(105);
  });
});

describe('catálogo de índices de exame', () => {
  it('toda calculadora tem versão, unidade, referência e marcadores exigidos', () => {
    for (const calculator of EXAM_INDEX_CALCULATORS) {
      expect(calculator.version).toMatch(/^\d{4}\.\d+$/);
      expect(calculator.reference.length).toBeGreaterThan(20);
      expect(calculator.requiredMarkers.length).toBeGreaterThan(0);
      expect(calculator.formula.length).toBeGreaterThan(5);
    }
  });

  it('códigos únicos', () => {
    const codes = EXAM_INDEX_CALCULATORS.map((calculator) => calculator.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
