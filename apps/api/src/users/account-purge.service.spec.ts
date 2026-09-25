import { AccountPurgeService } from './account-purge.service';

type MockRepo = {
  find: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  save: jest.Mock;
};

function mockRepo(overrides: Partial<MockRepo> = {}): MockRepo {
  return {
    find: jest.fn(async () => []),
    update: jest.fn(async () => ({ affected: 0 })),
    delete: jest.fn(async () => ({ affected: 1 })),
    save: jest.fn(async (entity) => entity),
    ...overrides,
  };
}

function pedido(overrides: Record<string, unknown> = {}) {
  return {
    id: 'req-1',
    userId: 'user-1',
    requestedAt: new Date('2026-08-01T00:00:00.000Z'),
    scheduledPurgeAt: new Date('2026-08-31T00:00:00.000Z'),
    completedAt: null,
    ...overrides,
  };
}

const AGORA = new Date('2026-09-25T12:00:00.000Z');

describe('AccountPurgeService', () => {
  let requests: MockRepo;
  let users: MockRepo;
  let consents: MockRepo;
  let service: AccountPurgeService;

  beforeEach(() => {
    requests = mockRepo();
    users = mockRepo();
    consents = mockRepo();
    service = new AccountPurgeService(requests as never, users as never, consents as never);
  });

  it('não apaga nada quando não há pedido vencido', async () => {
    const resultado = await service.purgeDueAccounts(AGORA);

    expect(resultado.purged).toBe(0);
    expect(users.delete).not.toHaveBeenCalled();
    expect(consents.update).not.toHaveBeenCalled();
  });

  it('só busca pedidos não concluídos e já vencidos', async () => {
    // A consulta é a única proteção contra apagar conta de quem ainda está no
    // período de arrependimento.
    await service.purgeDueAccounts(AGORA);

    const where = requests.find.mock.calls[0][0].where;
    expect(where.completedAt).toBeDefined();
    expect(where.scheduledPurgeAt).toBeDefined();
  });

  it('apaga o usuário vencido, deixando o cascade levar os dados dele', async () => {
    requests.find.mockResolvedValueOnce([pedido()]);

    const resultado = await service.purgeDueAccounts(AGORA);

    expect(users.delete).toHaveBeenCalledWith('user-1');
    expect(resultado.purged).toBe(1);
  });

  it('anonimiza os consents em vez de apagá-los, limpando IP e user agent', async () => {
    // Decisão consciente: o registro de consentimento sobrevive como prova,
    // mas sem os identificadores diretos (IP é dado pessoal sob LGPD).
    requests.find.mockResolvedValueOnce([pedido()]);

    await service.purgeDueAccounts(AGORA);

    expect(consents.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      { ipAddress: null, userAgent: null },
    );
    expect(consents.delete).not.toHaveBeenCalled();
  });

  it('anonimiza o consent ANTES de apagar o usuário', async () => {
    // Se falhar no meio, o dado sensível já saiu e a próxima execução retoma.
    requests.find.mockResolvedValueOnce([pedido()]);
    const ordem: string[] = [];
    consents.update.mockImplementation(async () => {
      ordem.push('consents');
      return { affected: 1 };
    });
    users.delete.mockImplementation(async () => {
      ordem.push('users');
      return { affected: 1 };
    });

    await service.purgeDueAccounts(AGORA);

    expect(ordem).toEqual(['consents', 'users']);
  });

  it('marca o pedido como concluído', async () => {
    const req = pedido();
    requests.find.mockResolvedValueOnce([req]);

    await service.purgeDueAccounts(AGORA);

    expect(requests.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'req-1', completedAt: AGORA }),
    );
  });

  it('conclui o pedido mesmo se o usuário já não existir', async () => {
    // Conta apagada à mão fora do fluxo: o pedido não pode ficar preso pra
    // sempre, reprocessado a cada execução.
    requests.find.mockResolvedValueOnce([pedido()]);
    users.delete.mockResolvedValueOnce({ affected: 0 });

    await service.purgeDueAccounts(AGORA);

    expect(requests.save).toHaveBeenCalledWith(expect.objectContaining({ completedAt: AGORA }));
  });

  it('processa os demais pedidos quando um falha, sem abortar a execução', async () => {
    requests.find.mockResolvedValueOnce([
      pedido({ id: 'req-1', userId: 'user-1' }),
      pedido({ id: 'req-2', userId: 'user-2' }),
    ]);
    users.delete.mockRejectedValueOnce(new Error('falha de banco'));

    const resultado = await service.purgeDueAccounts(AGORA);

    expect(users.delete).toHaveBeenCalledWith('user-2');
    expect(resultado.purged).toBe(1);
    expect(resultado.failed).toBe(1);
  });

  it('não marca como concluído o pedido que falhou, pra ser retentado depois', async () => {
    requests.find.mockResolvedValueOnce([pedido()]);
    users.delete.mockRejectedValueOnce(new Error('falha de banco'));

    await service.purgeDueAccounts(AGORA);

    expect(requests.save).not.toHaveBeenCalled();
  });
});
