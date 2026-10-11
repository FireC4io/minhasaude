import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { AuthService } from '../auth.service';
import { SecurityNotifier } from '../../mail/security-notifier';
import type { TokensDto } from '../dto/tokens.dto';
import { GoogleTokenVerifier, type GoogleIdentity } from './google-token-verifier';

const GENERIC_GOOGLE_ERROR = 'Não foi possível entrar com o Google';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly verifier: GoogleTokenVerifier,
    private readonly authService: AuthService,
    private readonly securityNotifier: SecurityNotifier,
  ) {}

  /**
   * Entra com o Google: acha a conta pelo `sub`, senão pelo e-mail (e liga o
   * Google a ela), senão cria uma conta nova sem senha.
   */
  async signIn(idToken: string): Promise<TokensDto> {
    const identity = await this.verifier.verify(idToken);
    // E-mail não confirmado no Google não prova nada sobre a caixa de entrada.
    if (!identity?.emailVerified) {
      throw new UnauthorizedException(GENERIC_GOOGLE_ERROR);
    }

    const user = (await this.users.findOne({ where: { googleSub: identity.sub } }))
      ?? (await this.linkOrCreate(identity));
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Conta suspensa ou em processo de exclusão.');
    }
    return this.authService.issueTokens(user);
  }

  private async linkOrCreate(identity: GoogleIdentity): Promise<User> {
    const email = identity.email.toLowerCase();
    const existing = await this.users
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email })
      .getOne();

    if (!existing) {
      return this.users.save(
        this.users.create({
          email,
          passwordHash: null,
          googleSub: identity.sub,
          emailVerifiedAt: new Date(),
          status: UserStatus.ACTIVE,
        }),
      );
    }
    if (existing.status !== UserStatus.ACTIVE) {
      return existing;
    }
    return this.link(existing, identity.sub);
  }

  /**
   * Liga o Google a uma conta de senha. Se essa conta nunca provou ser dona do
   * e-mail, quem a criou pode ter sido outra pessoa (pré-sequestro de conta):
   * a senha antiga é apagada e as sessões abertas caem. A dona de verdade cria
   * uma senha nova em "Esqueci minha senha", se quiser.
   */
  private async link(user: User, googleSub: string): Promise<User> {
    const unverified = user.emailVerifiedAt === null;
    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { id: user.id },
        unverified
          ? { googleSub, emailVerifiedAt: now, passwordHash: null }
          : { googleSub },
      );
      if (unverified) {
        await manager.update(RefreshToken, { userId: user.id, revokedAt: IsNull() }, { revokedAt: now });
      }
    });
    this.securityNotifier.notify(user.email, unverified ? 'google_linked_password_removed' : 'google_linked', user.id);
    if (unverified) {
      this.logger.warn(`Google ligado à conta ${user.id} sem e-mail confirmado: senha antiga apagada`);
    }
    return {
      ...user,
      googleSub,
      emailVerifiedAt: unverified ? now : user.emailVerifiedAt,
      passwordHash: unverified ? null : user.passwordHash,
    };
  }
}
