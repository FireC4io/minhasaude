import { profileFormSchema, weightEntrySchema } from './schemas';

describe('profileFormSchema', () => {
  const valid = {
    birthDate: '1996-05-20',
    sex: 'female' as const,
    heightCm: 165,
    activityLevel: 'moderate' as const,
    goal: 'lose' as const,
  };

  it('aceita um perfil válido', () => {
    expect(profileFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita altura fora da faixa (50-272cm)', () => {
    expect(profileFormSchema.safeParse({ ...valid, heightCm: 49 }).success).toBe(false);
    expect(profileFormSchema.safeParse({ ...valid, heightCm: 273 }).success).toBe(false);
  });

  it('rejeita data de nascimento em formato inválido', () => {
    expect(profileFormSchema.safeParse({ ...valid, birthDate: '20/05/1996' }).success).toBe(false);
  });

  it('rejeita valores de enum fora da lista', () => {
    expect(profileFormSchema.safeParse({ ...valid, sex: 'other' }).success).toBe(false);
    expect(profileFormSchema.safeParse({ ...valid, goal: 'bulk' }).success).toBe(false);
  });
});

describe('weightEntrySchema', () => {
  it('aceita peso válido sem % de gordura', () => {
    expect(weightEntrySchema.safeParse({ weightKg: 70.5 }).success).toBe(true);
  });

  it('aceita peso válido com % de gordura', () => {
    expect(weightEntrySchema.safeParse({ weightKg: 70.5, bodyFatPercent: 18.5 }).success).toBe(true);
  });

  it('rejeita peso fora da faixa (20-400kg)', () => {
    expect(weightEntrySchema.safeParse({ weightKg: 19 }).success).toBe(false);
    expect(weightEntrySchema.safeParse({ weightKg: 401 }).success).toBe(false);
  });

  it('rejeita % de gordura fora da faixa (2-70)', () => {
    expect(weightEntrySchema.safeParse({ weightKg: 70, bodyFatPercent: 1 }).success).toBe(false);
    expect(weightEntrySchema.safeParse({ weightKg: 70, bodyFatPercent: 71 }).success).toBe(false);
  });
});
