import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  mifflinStJeor,
  katchMcArdle,
  calculateTdee,
  applyGoalAdjustment,
  distributeMacros,
  type ActivityLevel as SharedActivityLevel,
  type Goal as SharedGoal,
} from '@minhasaude/shared';
import { GoalTarget, CalculationMethod } from '../database/entities/goal-target.entity';
import { Profile } from '../database/entities/profile.entity';
import { BodyMeasurementsService } from '../body-measurements/body-measurements.service';
import type { RecalculateGoalDto } from './dto/recalculate-goal.dto';
import type { UpdateGoalDto } from './dto/update-goal.dto';
import type { PaginatedResult } from '../common/types/paginated-result.interface';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';

function calculateAgeYears(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(GoalTarget) private readonly goalTargets: Repository<GoalTarget>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    private readonly bodyMeasurementsService: BodyMeasurementsService,
  ) {}

  private async findCurrent(userId: string): Promise<GoalTarget | null> {
    return this.goalTargets.findOne({ where: { userId }, order: { activeFrom: 'DESC' } });
  }

  async getCurrent(userId: string): Promise<GoalTarget> {
    const current = await this.findCurrent(userId);
    if (!current) {
      throw new NotFoundException('Nenhuma meta calculada ainda. Use POST /v1/goals/recalculate.');
    }
    return current;
  }

  async recalculate(userId: string, dto: RecalculateGoalDto): Promise<GoalTarget> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile?.birthDate || !profile.sex || !profile.heightCm || !profile.activityLevel || !profile.goal) {
      throw new BadRequestException(
        'Perfil incompleto para calcular a meta. Preencha data de nascimento, sexo, altura, nível de atividade e objetivo em PATCH /v1/me/profile.',
      );
    }

    const latestMeasurement = await this.bodyMeasurementsService.findLatest(userId);
    if (!latestMeasurement) {
      throw new BadRequestException(
        'Nenhuma medida corporal registrada. Registre seu peso em POST /v1/body-measurements antes de calcular a meta.',
      );
    }

    const weightKg = Number(latestMeasurement.weightKg);
    const bodyFatPercent =
      latestMeasurement.bodyFatPercent !== null ? Number(latestMeasurement.bodyFatPercent) : null;

    let method = dto.method;
    if (method === CalculationMethod.KATCH_MCARDLE && bodyFatPercent === null) {
      throw new BadRequestException(
        'katch_mcardle exige % de gordura corporal na medida mais recente. Registre bodyFatPercent em POST /v1/body-measurements ou use mifflin_st_jeor.',
      );
    }
    if (!method) {
      method = bodyFatPercent !== null ? CalculationMethod.KATCH_MCARDLE : CalculationMethod.MIFFLIN_ST_JEOR;
    }

    const heightCm = Number(profile.heightCm);
    const ageYears = calculateAgeYears(profile.birthDate);
    const activityLevel = profile.activityLevel as unknown as SharedActivityLevel;
    const goal = profile.goal as unknown as SharedGoal;

    const bmrKcal =
      method === CalculationMethod.KATCH_MCARDLE
        ? katchMcArdle.compute({ weightKg, bodyFatPercent: bodyFatPercent as number })
        : mifflinStJeor.compute({
            sex: profile.sex as unknown as 'male' | 'female',
            weightKg,
            heightCm,
            ageYears,
          });

    const tdeeKcal = calculateTdee(bmrKcal, activityLevel);
    const targetKcal = applyGoalAdjustment(tdeeKcal, goal);
    const macros = distributeMacros({ kcalBudget: targetKcal, weightKg, goal });

    const goalTarget = this.goalTargets.create({
      userId,
      profileSnapshot: {
        birthDate: profile.birthDate,
        sex: profile.sex,
        heightCm,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        weightKg,
        bodyFatPercent,
        measuredAt: latestMeasurement.measuredAt,
      },
      calculationMethod: method,
      bmrKcal: bmrKcal.toString(),
      tdeeKcal: tdeeKcal.toString(),
      targetKcal: targetKcal.toString(),
      proteinG: macros.proteinG.toString(),
      fatG: macros.fatG.toString(),
      carbG: macros.carbG.toString(),
      isManualOverride: false,
      activeFrom: new Date(),
    });
    return this.goalTargets.save(goalTarget);
  }

  async updateManual(userId: string, dto: UpdateGoalDto): Promise<GoalTarget> {
    if (
      dto.targetKcal === undefined &&
      dto.proteinG === undefined &&
      dto.fatG === undefined &&
      dto.carbG === undefined
    ) {
      throw new BadRequestException('Informe ao menos um campo para ajustar (targetKcal, proteinG, fatG ou carbG).');
    }

    const current = await this.findCurrent(userId);
    if (!current) {
      throw new NotFoundException(
        'Nenhuma meta calculada ainda. Use POST /v1/goals/recalculate antes de ajustar manualmente.',
      );
    }

    const updated = this.goalTargets.create({
      userId,
      profileSnapshot: current.profileSnapshot,
      calculationMethod: current.calculationMethod,
      bmrKcal: current.bmrKcal,
      tdeeKcal: current.tdeeKcal,
      targetKcal: (dto.targetKcal ?? Number(current.targetKcal)).toString(),
      proteinG: (dto.proteinG ?? Number(current.proteinG)).toString(),
      fatG: (dto.fatG ?? Number(current.fatG)).toString(),
      carbG: (dto.carbG ?? Number(current.carbG)).toString(),
      isManualOverride: true,
      activeFrom: new Date(),
    });
    return this.goalTargets.save(updated);
  }

  // Usado por GET /v1/me/export - histórico completo, não só a página atual.
  async listAll(userId: string): Promise<GoalTarget[]> {
    return this.goalTargets.find({ where: { userId }, order: { activeFrom: 'DESC' } });
  }

  async history(userId: string, query: PaginationQueryDto): Promise<PaginatedResult<GoalTarget>> {
    const [data, total] = await this.goalTargets.findAndCount({
      where: { userId },
      order: { activeFrom: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { data, meta: { total, page: query.page, limit: query.limit } };
  }
}
