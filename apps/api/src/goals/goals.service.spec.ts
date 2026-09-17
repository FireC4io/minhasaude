import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ACTIVITY_MULTIPLIERS } from '@minhasaude/shared';
import { GoalsService } from './goals.service';
import { CalculationMethod } from '../database/entities/goal-target.entity';
import { ActivityLevel, Goal, Sex } from '../database/entities/profile.entity';

type MockGoalRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  find: jest.Mock;
};

type MockProfileRepo = { findOne: jest.Mock };
type MockBodyMeasurementsService = { findLatest: jest.Mock };

function mockGoalRepo(): MockGoalRepo {
  return {
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => ({ id: 'goal-1', createdAt: new Date(), updatedAt: new Date(), ...entity })),
    findOne: jest.fn(),
    findAndCount: jest.fn(async () => [[], 0]),
    find: jest.fn(async () => []),
  };
}

const completeProfile = {
  userId: 'user-1',
  birthDate: '1990-06-15',
  sex: Sex.MALE,
  heightCm: '178',
  activityLevel: ActivityLevel.MODERATE,
  goal: Goal.LOSE,
};

describe('GoalsService', () => {
  let service: GoalsService;
  let goalTargets: MockGoalRepo;
  let profiles: MockProfileRepo;
  let bodyMeasurementsService: MockBodyMeasurementsService;

  beforeEach(() => {
    goalTargets = mockGoalRepo();
    profiles = { findOne: jest.fn() };
    bodyMeasurementsService = { findLatest: jest.fn() };
    service = new GoalsService(goalTargets as never, profiles as never, bodyMeasurementsService as never);
  });

  describe('recalculate', () => {
    it('rejeita quando o perfil está incompleto', async () => {
      profiles.findOne.mockResolvedValue({ ...completeProfile, heightCm: null });
      await expect(service.recalculate('user-1', {})).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando não há medida corporal registrada', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue(null);
      await expect(service.recalculate('user-1', {})).rejects.toThrow(BadRequestException);
    });

    it('rejeita katch_mcardle explícito sem % de gordura na medida mais recente', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue({
        weightKg: '80.00',
        bodyFatPercent: null,
        measuredAt: new Date(),
      });
      await expect(service.recalculate('user-1', { method: CalculationMethod.KATCH_MCARDLE })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('usa mifflin_st_jeor por padrão quando não há % de gordura', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue({
        weightKg: '80.00',
        bodyFatPercent: null,
        measuredAt: new Date(),
      });
      const result = await service.recalculate('user-1', {});
      expect(result.calculationMethod).toBe(CalculationMethod.MIFFLIN_ST_JEOR);
    });

    it('usa katch_mcardle por padrão quando há % de gordura na medida mais recente', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue({
        weightKg: '80.00',
        bodyFatPercent: '18.0',
        measuredAt: new Date(),
      });
      const result = await service.recalculate('user-1', {});
      expect(result.calculationMethod).toBe(CalculationMethod.KATCH_MCARDLE);
    });

    it('aplica o multiplicador de atividade correto sobre a TMB pra chegar no TDEE', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue({
        weightKg: '80.00',
        bodyFatPercent: null,
        measuredAt: new Date(),
      });
      const result = await service.recalculate('user-1', {});
      const bmr = Number(result.bmrKcal);
      const tdee = Number(result.tdeeKcal);
      expect(tdee).toBeCloseTo(bmr * ACTIVITY_MULTIPLIERS.moderate, 2);
    });

    it('aplica o déficit de 500kcal do objetivo lose sobre o TDEE pra chegar no target', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue({
        weightKg: '80.00',
        bodyFatPercent: null,
        measuredAt: new Date(),
      });
      const result = await service.recalculate('user-1', {});
      expect(Number(result.targetKcal)).toBeCloseTo(Number(result.tdeeKcal) - 500, 2);
    });

    it('as calorias de macros somam o target_kcal', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue({
        weightKg: '80.00',
        bodyFatPercent: null,
        measuredAt: new Date(),
      });
      const result = await service.recalculate('user-1', {});
      const macroKcal = Number(result.proteinG) * 4 + Number(result.fatG) * 9 + Number(result.carbG) * 4;
      expect(macroKcal).toBeCloseTo(Number(result.targetKcal), 0);
    });

    it('grava is_manual_override=false e o snapshot do perfil/medida usados', async () => {
      profiles.findOne.mockResolvedValue(completeProfile);
      bodyMeasurementsService.findLatest.mockResolvedValue({
        weightKg: '80.00',
        bodyFatPercent: null,
        measuredAt: new Date('2026-09-01T00:00:00.000Z'),
      });
      const result = await service.recalculate('user-1', {});
      expect(result.isManualOverride).toBe(false);
      expect(result.profileSnapshot).toMatchObject({ weightKg: 80, goal: Goal.LOSE });
    });
  });

  describe('getCurrent', () => {
    it('lança NotFoundException quando o usuário nunca calculou uma meta', async () => {
      goalTargets.findOne.mockResolvedValue(null);
      await expect(service.getCurrent('user-1')).rejects.toThrow(NotFoundException);
    });

    it('retorna a meta mais recente', async () => {
      const goal = { id: 'goal-1', targetKcal: '2000' };
      goalTargets.findOne.mockResolvedValue(goal);
      await expect(service.getCurrent('user-1')).resolves.toBe(goal);
      expect(goalTargets.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' }, order: { activeFrom: 'DESC' } }),
      );
    });
  });

  describe('updateManual', () => {
    it('rejeita quando nenhum campo é informado', async () => {
      await expect(service.updateManual('user-1', {})).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando não há meta ativa pra ajustar', async () => {
      goalTargets.findOne.mockResolvedValue(null);
      await expect(service.updateManual('user-1', { targetKcal: 1800 })).rejects.toThrow(NotFoundException);
    });

    it('cria uma linha nova com is_manual_override=true, preservando campos não informados', async () => {
      goalTargets.findOne.mockResolvedValue({
        calculationMethod: CalculationMethod.MIFFLIN_ST_JEOR,
        bmrKcal: '1700.00',
        tdeeKcal: '2635.00',
        targetKcal: '2135.00',
        proteinG: '160.00',
        fatG: '65.28',
        carbG: '230.13',
        profileSnapshot: { weightKg: 80 },
      });
      const result = await service.updateManual('user-1', { targetKcal: 1800 });
      expect(result.isManualOverride).toBe(true);
      expect(result.targetKcal).toBe('1800');
      expect(result.proteinG).toBe('160'); // preservado do registro anterior
    });
  });

  describe('history', () => {
    it('devolve meta de paginação', async () => {
      goalTargets.findAndCount.mockResolvedValueOnce([[{ id: 'a' }], 1]);
      const result = await service.history('user-1', { page: 1, limit: 20 });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20 });
    });
  });
});
