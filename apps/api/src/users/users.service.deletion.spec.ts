import { ConflictException } from '@nestjs/common';
import { UserStatus } from '../database/entities/user.entity';
import { UsersService } from './users.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const firstArg = (mock: jest.Mock): any => mock.mock.calls[0]![0];

function setup(options: { status?: UserStatus; purgeFails?: boolean } = {}) {
  const user = { id: 'user-1', status: options.status ?? UserStatus.ACTIVE };
  const users = {
    findOne: jest.fn(async () => user),
    save: jest.fn(async (entity) => entity),
  };
  const refreshTokens = { update: jest.fn(async () => ({ affected: 1 })) };
  const deletionRequests = {
    create: jest.fn((data) => data),
    save: jest.fn(async (entity) => ({ id: 'req-1', ...entity })),
  };
  const purge = {
    purgeRequest: jest.fn(async () => {
      if (options.purgeFails) throw new Error('banco fora do ar');
    }),
  };
  const service = new UsersService(
    users as never,
    {} as never,
    refreshTokens as never,
    deletionRequests as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    purge as never,
  );
  return { service, user, users, refreshTokens, deletionRequests, purge };
}

describe('UsersService.requestDeletion', () => {
  it('apaga na hora, com o pedido já vencido', async () => {
    const { service, deletionRequests, purge } = setup();

    const result = await service.requestDeletion('user-1');

    expect(result).toEqual({ status: 'deleted' });
    const pedido = firstArg(deletionRequests.create);
    expect(pedido.scheduledPurgeAt).toEqual(pedido.requestedAt);
    expect(purge.purgeRequest).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'req-1', userId: 'user-1' }),
      pedido.requestedAt,
    );
  });

  it('bloqueia a conta e revoga os tokens antes de apagar', async () => {
    const { service, users, refreshTokens, purge } = setup();

    await service.requestDeletion('user-1');

    expect(firstArg(users.save).status).toBe(UserStatus.PENDING_DELETION);
    expect(refreshTokens.update).toHaveBeenCalled();
    expect(users.save.mock.invocationCallOrder[0]!).toBeLessThan(
      purge.purgeRequest.mock.invocationCallOrder[0]!,
    );
  });

  it('se o purge falhar, a conta segue bloqueada e o job diário termina', async () => {
    const { service, users } = setup({ purgeFails: true });

    const result = await service.requestDeletion('user-1');

    expect(result).toEqual({ status: 'pending_retry' });
    expect(firstArg(users.save).status).toBe(UserStatus.PENDING_DELETION);
  });

  it('recusa um segundo pedido para conta já em exclusão', async () => {
    const { service, purge } = setup({ status: UserStatus.PENDING_DELETION });

    await expect(service.requestDeletion('user-1')).rejects.toBeInstanceOf(ConflictException);
    expect(purge.purgeRequest).not.toHaveBeenCalled();
  });
});
