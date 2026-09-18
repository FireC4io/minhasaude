import { z } from 'zod';
import { ACTIVITY_LEVELS, GOALS, SEXES } from './enums';

// Limites espelham as validações de apps/api/src/users/dto/update-profile.dto.ts.
export const profileFormSchema = z.object({
  birthDate: z.string().date('Data inválida'),
  sex: z.enum(SEXES),
  heightCm: z.number().min(50).max(272),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(GOALS),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Limites espelham apps/api/src/body-measurements/dto/create-body-measurement.dto.ts.
export const weightEntrySchema = z.object({
  weightKg: z.number().min(20).max(400),
  bodyFatPercent: z.number().min(2).max(70).optional(),
});

export type WeightEntryValues = z.infer<typeof weightEntrySchema>;
