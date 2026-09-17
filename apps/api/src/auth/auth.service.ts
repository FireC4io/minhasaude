import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { User, UserStatus } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import type { Env } from '../config/env.schema';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { TokensDto } from './dto/tokens.dto';
import type { JwtPayload } from './types/jwt-payload.interface';

const GENERIC_CREDENTIALS_ERROR = 'Credenciais inválidas';
const GENERIC_TOKEN_ERROR = 'Refresh token inválido ou expirado';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto): Promise<Pick<User, 'id' | 'email' | 'status'>> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe uma conta com este email');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = this.users.create({
      email: dto.email,
      passwordHash,
      status: UserStatus.ACTIVE,
    });
    const saved = await this.users.save(user);
    return { id: saved.id, email: saved.email, status: saved.status };
  }

  async login(dto: LoginDto): Promise<TokensDto> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException(GENERIC_CREDENTIALS_ERROR);
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) {
      throw new UnauthorizedException(GENERIC_CREDENTIALS_ERROR);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Conta suspensa ou em processo de exclusão.');
    }

    return this.issueTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<TokensDto> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.refreshTokens.findOne({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException(GENERIC_TOKEN_ERROR);
    }

    // Rotação: o token usado é revogado imediatamente, mesmo que a emissão do novo falhe depois.
    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    const user = await this.users.findOne({ where: { id: stored.userId } });
    if (!user) {
      throw new UnauthorizedException(GENERIC_TOKEN_ERROR);
    }

    return this.issueTokens(user);
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.refreshTokens.findOne({ where: { tokenHash, userId } });

    if (!stored) {
      throw new UnauthorizedException(GENERIC_TOKEN_ERROR);
    }

    if (!stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokens.save(stored);
    }
  }

  private async issueTokens(user: User): Promise<TokensDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const decoded = this.jwtService.decode<{ iat: number; exp: number }>(accessToken);
    const expiresInSeconds = decoded.exp - decoded.iat;

    const rawRefreshToken = randomBytes(64).toString('hex');
    const ttlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const refreshToken = this.refreshTokens.create({
      userId: user.id,
      tokenHash: this.hashToken(rawRefreshToken),
      expiresAt,
      revokedAt: null,
      deviceInfo: null,
    });
    await this.refreshTokens.save(refreshToken);

    return { accessToken, refreshToken: rawRefreshToken, expiresInSeconds };
  }

  // Refresh tokens são aleatórios de alta entropia (não senhas de usuário) -
  // hash rápido é apropriado aqui, argon2 é reservado para password_hash.
  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
