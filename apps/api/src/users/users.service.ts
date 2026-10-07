import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User, UserStatus } from '../database/entities/user.entity';
import { Profile } from '../database/entities/profile.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { AccountDeletionRequest } from '../database/entities/account-deletion-request.entity';
import { ConsentsService } from '../consents/consents.service';
import { BodyMeasurementsService } from '../body-measurements/body-measurements.service';
import { GoalsService } from '../goals/goals.service';
import { DiaryService } from '../diary/diary.service';
import { BodyMeasurementSource } from '../database/entities/body-measurement.entity';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { AccountPurgeService } from './account-purge.service';

export type DeletionStatus = 'deleted' | 'pending_retry';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(AccountDeletionRequest)
    private readonly deletionRequests: Repository<AccountDeletionRequest>,
    private readonly consentsService: ConsentsService,
    private readonly bodyMeasurementsService: BodyMeasurementsService,
    private readonly goalsService: GoalsService,
    private readonly diaryService: DiaryService,
    private readonly accountPurgeService: AccountPurgeService,
  ) {}

  private async getUserOrThrow(userId: string): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async getMe(userId: string): Promise<{ user: Partial<User>; profile: Profile | null }> {
    const user = await this.getUserOrThrow(userId);
    const profile = await this.profiles.findOne({ where: { userId } });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { user: safeUser, profile };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    let profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profiles.create({ userId, goalUpdatedAt: null });
    }
    const { weeklyPaceKg, ...rest } = dto;
    Object.assign(profile, rest);
    if (weeklyPaceKg !== undefined) {
      profile.weeklyPaceKg = weeklyPaceKg === null ? null : weeklyPaceKg.toString();
    }
    if (dto.goal || weeklyPaceKg !== undefined) {
      profile.goalUpdatedAt = new Date();
    }
    return this.profiles.save(profile);
  }

  // GET /v1/me/export - snapshot funcional de todos os dados disponíveis até
  // a fase atual. Expandir aqui conforme cada fase nova adicionar dados do
  // usuário (ver CLAUDE.md).
  async exportData(userId: string) {
    const user = await this.getUserOrThrow(userId);
    const profile = await this.profiles.findOne({ where: { userId } });
    const consents = await this.consentsService.listHistory(userId);
    const bodyMeasurements = await this.bodyMeasurementsService.listAll(userId);
    const goals = await this.goalsService.listAll(userId);
    const diaryEntries = await this.diaryService.listAll(userId);
    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      exportedAt: new Date().toISOString(),
      account: safeUser,
      profile,
      consents,
      bodyMeasurements,
      goals,
      diaryEntries,
    };
  }

  /**
   * Exclusão imediata (decisão do dono do projeto, 2026-10-07): não há como
   * cancelar, então um prazo de espera só guardaria dados sem benefício.
   *
   * A conta é bloqueada e os tokens revogados antes de apagar. Se o purge
   * falhar no meio, o pedido fica com `scheduledPurgeAt` já vencido e o job
   * diário (`AccountPurgeScheduler`) termina o trabalho — a pessoa não
   * consegue mais entrar de qualquer forma.
   */
  /**
   * Dados do relatório de progresso (o PDF é montado no celular). Separado do
   * export LGPD de propósito: o conteúdo da exportação ainda será discutido.
   * Só o peso da balança comum entra — o relatório nunca mistura aparelhos.
   */
  async getProgressReport(userId: string) {
    const measurements = await this.bodyMeasurementsService.listAll(userId);
    const goals = await this.goalsService.listAll(userId);
    const diaryEntries = await this.diaryService.listAllWithFood(userId);

    return {
      generatedAt: new Date(),
      weights: measurements
        .filter((m) => m.source === BodyMeasurementSource.MANUAL)
        .reverse(),
      goals: [...goals].reverse(),
      diaryEntries,
    };
  }

  async requestDeletion(userId: string): Promise<{ status: DeletionStatus }> {
    const user = await this.getUserOrThrow(userId);
    if (user.status === UserStatus.PENDING_DELETION) {
      throw new ConflictException('Exclusão de conta já está em andamento.');
    }

    const now = new Date();

    user.status = UserStatus.PENDING_DELETION;
    await this.users.save(user);

    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: now },
    );

    const request = await this.deletionRequests.save(
      this.deletionRequests.create({
        userId,
        requestedAt: now,
        scheduledPurgeAt: now,
        completedAt: null,
      }),
    );

    try {
      await this.accountPurgeService.purgeRequest(request, now);
      return { status: 'deleted' };
    } catch (error: unknown) {
      this.logger.error(
        `Exclusão imediata da conta ${userId} falhou; o job diário vai tentar de novo (pedido ${request.id})`,
        error instanceof Error ? error.stack : String(error),
      );
      return { status: 'pending_retry' };
    }
  }
}
