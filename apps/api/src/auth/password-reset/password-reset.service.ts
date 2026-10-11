import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { PASSWORD_RESET_CODE_TTL_MINUTES } from '@minhasaude/shared';
import { User, UserStatus } from '../../database/entities/user.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { PasswordResetCode } from '../../database/entities/password-reset-code.entity';
import { Mailer } from '../../mail/mailer';
import type { Env } from '../../config/env.schema';
import { buildPasswordResetEmail, type EmailLanguage } from './password-reset-email';
import { generateResetCode, hashResetCode, resetCodeMatches } from './password-reset-code';

export const RESET_CODE_TTL_MINUTES = PASSWORD_RESET_CODE_TTL_MINUTES;
/** Erros permitidos por código; com 3 códigos por hora, são 15 palpites em 10^6 por hora. */
export const RESET_CODE_MAX_ATTEMPTS = 5;
export const RESET_CODES_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;
const HISTORY_MS = 24 * HOUR_MS;

const GENERIC_CODE_ERROR = 'Código inválido ou expirado';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PasswordResetCode) private readonly codes: Repository<PasswordResetCode>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly mailer: Mailer,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Responde do mesmo jeito (e no mesmo tempo) exista a conta ou não: depois de
   * achar a pessoa, gerar e mandar o código segue fora da resposta.
   */
  async request(email: string, language?: EmailLanguage): Promise<void> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      return;
    }
    void this.issueCode(user, language).catch((error: unknown) => {
      this.logger.error(
        `Código de recuperar senha não saiu para a conta ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async confirm(email: string, code: string, newPassword: string): Promise<void> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(GENERIC_CODE_ERROR);
    }

    const stored = await this.codes.findOne({
      where: { userId: user.id, usedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    if (!stored || !(await this.spendAttempt(stored.id))) {
      throw new BadRequestException(GENERIC_CODE_ERROR);
    }
    if (!resetCodeMatches(this.secret(), user.id, code, stored.codeHash)) {
      throw new BadRequestException(GENERIC_CODE_ERROR);
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      // Só um pedido ganha: o segundo com o mesmo código não acha mais `used_at` vazio.
      const claimed = await manager.update(PasswordResetCode, { id: stored.id, usedAt: IsNull() }, { usedAt: now });
      if (claimed.affected !== 1) {
        throw new BadRequestException(GENERIC_CODE_ERROR);
      }
      await manager.update(User, { id: user.id }, { passwordHash });
      // Senha nova derruba todas as sessões abertas, inclusive a de quem roubou a antiga.
      await manager.update(RefreshToken, { userId: user.id, revokedAt: IsNull() }, { revokedAt: now });
    });
  }

  private async issueCode(user: User, language?: EmailLanguage): Promise<void> {
    const now = Date.now();
    const recent = await this.codes.count({
      where: { userId: user.id, createdAt: MoreThan(new Date(now - HOUR_MS)) },
    });
    if (recent >= RESET_CODES_PER_HOUR) {
      this.logger.warn(`Limite de códigos de recuperar senha atingido pela conta ${user.id}`);
      return;
    }

    await this.codes.delete({ userId: user.id, createdAt: LessThan(new Date(now - HISTORY_MS)) });
    // Só o código mais novo vale.
    await this.codes.update({ userId: user.id, usedAt: IsNull() }, { usedAt: new Date(now) });

    const code = generateResetCode();
    const saved = await this.codes.save(
      this.codes.create({
        userId: user.id,
        codeHash: hashResetCode(this.secret(), user.id, code),
        expiresAt: new Date(now + RESET_CODE_TTL_MINUTES * 60 * 1000),
        attempts: 0,
        usedAt: null,
      }),
    );
    try {
      await this.mailer.send(buildPasswordResetEmail(user.email, code, RESET_CODE_TTL_MINUTES, language));
    } catch (error) {
      // E-mail que não saiu não gasta a cota da hora: a pessoa pode pedir de novo assim que o envio voltar.
      await this.codes.delete({ id: saved.id });
      throw error;
    }
  }

  /** Gasta uma tentativa antes de comparar, num UPDATE só: pedidos em paralelo não furam o limite. */
  private async spendAttempt(codeId: string): Promise<boolean> {
    const result = await this.codes
      .createQueryBuilder()
      .update(PasswordResetCode)
      .set({ attempts: () => 'attempts + 1' })
      .where('id = :id AND attempts < :max AND used_at IS NULL', {
        id: codeId,
        max: RESET_CODE_MAX_ATTEMPTS,
      })
      .execute();
    return result.affected === 1;
  }

  private secret(): string {
    return this.config.get('JWT_ACCESS_SECRET', { infer: true });
  }
}
