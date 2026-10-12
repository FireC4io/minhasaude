import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PORTION_LIMITS } from '@minhasaude/shared';
import { PortionsService } from './portions.service';

function portion(overrides: Record<string, unknown>) {
  return { id: 'p', foodId: 'food-1', kind: null, userId: null, label: null, grams: '10.00', createdAt: new Date(0), ...overrides };
}

describe('PortionsService', () => {
  let repo: { find: jest.Mock; count: jest.Mock; create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let foodsService: { findById: jest.Mock };
  let manager: { query: jest.Mock; remove: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let service: PortionsService;

  beforeEach(() => {
    repo = {
      find: jest.fn(async () => []),
      count: jest.fn(async () => 0),
      create: jest.fn((e) => e),
      save: jest.fn(async (e) => ({ id: 'new', ...e })),
      findOne: jest.fn(),
    };
    foodsService = { findById: jest.fn(async () => ({ id: 'food-1' })) };
    manager = { query: jest.fn(async () => []), remove: jest.fn(async () => undefined) };
    dataSource = { transaction: jest.fn(async (fn) => fn(manager)) };
    service = new PortionsService(repo as never, foodsService as never, dataSource as never);
  });

  describe('list', () => {
    it('confere que a pessoa enxerga o alimento antes de listar', async () => {
      foodsService.findById.mockRejectedValue(new NotFoundException());
      await expect(service.list('food-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('busca as do sistema e só as da própria pessoa', async () => {
      await service.list('food-1', 'user-1');
      const where = repo.find.mock.calls[0][0].where;
      expect(where).toHaveLength(2);
      expect(where[1]).toEqual({ foodId: 'food-1', userId: 'user-1' });
    });

    it('ordena: medidas do sistema na ordem da lista, depois as da pessoa', async () => {
      repo.find.mockResolvedValue([
        portion({ id: 'minha', userId: 'user-1', label: 'Minha caneca' }),
        portion({ id: 'concha', kind: 'ladle' }),
        portion({ id: 'unidade', kind: 'unit' }),
      ]);
      const result = await service.list('food-1', 'user-1');
      expect(result.map((p) => p.id)).toEqual(['unidade', 'concha', 'minha']);
    });
  });

  describe('create', () => {
    it('grava a medida como da pessoa, com o texto sem espaços sobrando', async () => {
      const created = await service.create('food-1', 'user-1', { label: '  Minha caneca ', grams: 180 });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ foodId: 'food-1', userId: 'user-1', kind: null, label: 'Minha caneca', grams: '180.00' }),
      );
      expect(created.id).toBe('new');
    });

    it('recusa acima do limite de medidas por alimento', async () => {
      repo.count.mockResolvedValue(PORTION_LIMITS.customPerFood);
      await expect(service.create('food-1', 'user-1', { label: 'x', grams: 1 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('não cria medida em alimento que a pessoa não enxerga', async () => {
      foodsService.findById.mockRejectedValue(new NotFoundException());
      await expect(service.create('food-x', 'user-1', { label: 'x', grams: 1 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('só apaga medida da própria pessoa', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('p', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'p', userId: 'user-1' } });
    });

    it('passa para gramas as anotações que usavam a medida, antes de apagar', async () => {
      const mine = portion({ id: 'p', userId: 'user-1', label: 'Minha caneca' });
      repo.findOne.mockResolvedValue(mine);
      await service.remove('p', 'user-1');
      expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE "diary_entries"'), ['p', 'user-1']);
      expect(manager.remove).toHaveBeenCalledWith(mine);
      expect(manager.query.mock.invocationCallOrder[0]).toBeLessThan(manager.remove.mock.invocationCallOrder[0] ?? 0);
    });
  });
});
