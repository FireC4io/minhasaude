import { BodyMeasurementsService } from './body-measurements.service';
import { BodyMeasurementSource } from '../database/entities/body-measurement.entity';

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findAndCount: jest.Mock;
  find: jest.Mock;
};

function mockRepo(): MockRepo {
  return {
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => ({ id: 'measurement-1', ...entity })),
    findAndCount: jest.fn(async () => [[], 0]),
    find: jest.fn(async () => []),
  };
}

describe('BodyMeasurementsService', () => {
  let service: BodyMeasurementsService;
  let repo: MockRepo;

  beforeEach(() => {
    repo = mockRepo();
    service = new BodyMeasurementsService(repo as never);
  });

  describe('create', () => {
    it('grava o source explicitamente informado, sem inferir nenhum valor', async () => {
      await service.create('user-1', {
        measuredAt: '2026-09-17T12:00:00.000Z',
        source: BodyMeasurementSource.MANUAL,
        weightKg: 70.5,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', source: BodyMeasurementSource.MANUAL, weightKg: '70.5' }),
      );
    });

    it('converte campos numéricos opcionais ausentes para null (nunca undefined na coluna)', async () => {
      await service.create('user-1', {
        measuredAt: '2026-09-17T12:00:00.000Z',
        source: BodyMeasurementSource.MANUAL,
        weightKg: 70.5,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ bodyFatPercent: null, muscleMassKg: null, leanMassKg: null }),
      );
    });

    it('grava o % de gordura quando informado', async () => {
      await service.create('user-1', {
        measuredAt: '2026-09-17T12:00:00.000Z',
        source: BodyMeasurementSource.MANUAL,
        weightKg: 70.5,
        bodyFatPercent: 18.5,
      });

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ bodyFatPercent: '18.5' }));
    });
  });

  describe('list', () => {
    it('sempre filtra por userId, mesmo sem nenhum outro filtro', async () => {
      await service.list('user-1', { page: 1, limit: 20 });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('aplica o filtro de source quando informado', async () => {
      await service.list('user-1', { page: 1, limit: 20, source: BodyMeasurementSource.MANUAL });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', source: BodyMeasurementSource.MANUAL } }),
      );
    });

    it('devolve meta de paginação com total, page e limit', async () => {
      repo.findAndCount.mockResolvedValueOnce([[{ id: 'a' }, { id: 'b' }], 2]);
      const result = await service.list('user-1', { page: 1, limit: 20 });
      expect(result.meta).toEqual({ total: 2, page: 1, limit: 20 });
      expect(result.data).toHaveLength(2);
    });

    it('aplica skip/take a partir de page e limit', async () => {
      await service.list('user-1', { page: 3, limit: 10 });
      expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
    });
  });
});
