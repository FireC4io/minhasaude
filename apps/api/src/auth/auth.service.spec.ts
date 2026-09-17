import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { User, UserStatus } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';

type MockRepo<T> = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
} & Partial<T>;

function mockRepo<T>(): MockRepo<T> {
  return {
    findOne: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => entity),
  } as unknown as MockRepo<T>;
}

describe('AuthService', () => {
  let service: AuthService;
  let users: MockRepo<User>;
  let refreshTokens: MockRepo<RefreshToken>;
  let jwtService: { signAsync: jest.Mock; decode: jest.Mock };
  let config: { get: jest.Mock };

  const existingUser: User = {
    id: 'user-1',
    email: 'existente@teste.com',
    passwordHash: '',
    emailVerifiedAt: null,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    existingUser.passwordHash = await argon2.hash('senhaCorreta123');
  });

  beforeEach(() => {
    users = mockRepo<User>();
    refreshTokens = mockRepo<RefreshToken>();
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
      decode: jest.fn().mockReturnValue({ iat: 1000, exp: 1900 }),
    };
    config = {
      get: jest.fn().mockReturnValue(30),
    };

    service = new AuthService(
      users as never,
      refreshTokens as never,
      jwtService as never,
      config as never,
    );
  });

  describe('register', () => {
    it('rejeita email já cadastrado', async () => {
      users.findOne.mockResolvedValue(existingUser);

      await expect(
        service.register({ email: existingUser.email, password: 'qualquerCoisa123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('cria usuário com senha em hash (nunca em texto puro)', async () => {
      users.findOne.mockResolvedValue(null);

      const result = await service.register({ email: 'novo@teste.com', password: 'senha12345' });

      expect(result.email).toBe('novo@teste.com');
      const savedArg = users.save.mock.calls[0][0];
      expect(savedArg.passwordHash).not.toBe('senha12345');
      expect(savedArg.passwordHash).toMatch(/^\$argon2/);
    });
  });

  describe('login', () => {
    it('rejeita email inexistente com mensagem genérica', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@teste.com', password: 'qualquer123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejeita senha errada com a mesma mensagem genérica de email inexistente', async () => {
      users.findOne.mockResolvedValue(existingUser);

      await expect(
        service.login({ email: existingUser.email, password: 'senhaErrada' }),
      ).rejects.toThrow('Credenciais inválidas');
    });

    it('emite tokens quando as credenciais estão corretas', async () => {
      users.findOne.mockResolvedValue(existingUser);

      const result = await service.login({
        email: existingUser.email,
        password: 'senhaCorreta123',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toHaveLength(128); // randomBytes(64).toString('hex')
      expect(result.expiresInSeconds).toBe(900);
      expect(refreshTokens.save).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rejeita refresh token que não existe', async () => {
      refreshTokens.findOne.mockResolvedValue(null);

      await expect(service.refresh('token-invalido')).rejects.toThrow(UnauthorizedException);
    });

    it('rejeita refresh token já revogado', async () => {
      refreshTokens.findOne.mockResolvedValue({
        id: 'rt-1',
        userId: existingUser.id,
        tokenHash: 'hash',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86_400_000),
      });

      await expect(service.refresh('token-revogado')).rejects.toThrow(UnauthorizedException);
    });

    it('rejeita refresh token expirado', async () => {
      refreshTokens.findOne.mockResolvedValue({
        id: 'rt-1',
        userId: existingUser.id,
        tokenHash: 'hash',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('token-expirado')).rejects.toThrow(UnauthorizedException);
    });

    it('rotaciona: revoga o token usado e emite um par novo', async () => {
      const stored = {
        id: 'rt-1',
        userId: existingUser.id,
        tokenHash: 'hash',
        revokedAt: null as Date | null,
        expiresAt: new Date(Date.now() + 86_400_000),
      };
      refreshTokens.findOne.mockResolvedValue(stored);
      users.findOne.mockResolvedValue(existingUser);

      const result = await service.refresh('token-valido');

      expect(stored.revokedAt).not.toBeNull();
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toHaveLength(128);
    });
  });

  describe('logout', () => {
    it('rejeita refresh token que não pertence ao usuário', async () => {
      refreshTokens.findOne.mockResolvedValue(null);

      await expect(service.logout(existingUser.id, 'token-alheio')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revoga o refresh token do usuário', async () => {
      const stored = {
        id: 'rt-1',
        userId: existingUser.id,
        tokenHash: 'hash',
        revokedAt: null as Date | null,
      };
      refreshTokens.findOne.mockResolvedValue(stored);

      await service.logout(existingUser.id, 'token-valido');

      expect(stored.revokedAt).not.toBeNull();
      expect(refreshTokens.save).toHaveBeenCalledWith(stored);
    });

    it('é idempotente se o token já estava revogado', async () => {
      const stored = {
        id: 'rt-1',
        userId: existingUser.id,
        tokenHash: 'hash',
        revokedAt: new Date(),
      };
      refreshTokens.findOne.mockResolvedValue(stored);

      await expect(service.logout(existingUser.id, 'token-ja-revogado')).resolves.toBeUndefined();
      expect(refreshTokens.save).not.toHaveBeenCalled();
    });
  });
});
