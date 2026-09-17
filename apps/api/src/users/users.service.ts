import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User, UserStatus } from '../database/entities/user.entity';
import { Profile } from '../database/entities/profile.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { AccountDeletionRequest } from '../database/entities/account-deletion-request.entity';
import { ConsentsService } from '../consents/consents.service';
import { BodyMeasurementsService } from '../body-measurements/body-measurements.service';
import { GoalsService } from '../goals/goals.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const DELETION_GRACE_PERIOD_DAYS = 30;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(AccountDeletionRequest)
    private readonly deletionRequests: Repository<AccountDeletionRequest>,
    private readonly consentsService: ConsentsService,
    private readonly bodyMeasurementsService: BodyMeasurementsService,
    private readonly goalsService: GoalsService,
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
    Object.assign(profile, dto);
    if (dto.goal) {
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
    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      exportedAt: new Date().toISOString(),
      account: safeUser,
      profile,
      consents,
      bodyMeasurements,
      goals,
    };
  }

  async requestDeletion(userId: string): Promise<{ scheduledPurgeAt: Date }> {
    const user = await this.getUserOrThrow(userId);
    if (user.status === UserStatus.PENDING_DELETION) {
      throw new ConflictException('Exclusão de conta já está em andamento.');
    }

    const now = new Date();
    const scheduledPurgeAt = new Date(now.getTime() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    user.status = UserStatus.PENDING_DELETION;
    await this.users.save(user);

    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: now },
    );

    const request = this.deletionRequests.create({
      userId,
      requestedAt: now,
      scheduledPurgeAt,
      completedAt: null,
    });
    await this.deletionRequests.save(request);

    return { scheduledPurgeAt };
  }
}
