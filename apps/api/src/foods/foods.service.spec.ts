import { NotFoundException } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { FoodSource } from '../database/entities/food.entity';
import type { OffProduct } from './open-food-facts.client';

type MockQueryBuilder = {
  where: jest.Mock;
  andWhere: jest.Mock;
  addSelect: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getCount: jest.Mock;
  getMany: jest.Mock;
};

function mockQueryBuilder(total: number, rows: unknown[]): MockQueryBuilder {
  const qb: Partial<MockQueryBuilder> = {};
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.addSelect = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.addOrderBy = jest.fn(() => qb);
  qb.skip = jest.fn(() => qb);
  qb.take = jest.fn(() => qb);
  qb.getCount = jest.fn(async () => total);
  qb.getMany = jest.fn(async () => rows);
  return qb as MockQueryBuilder;
}

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function mockRepo(): MockRepo {
  return {
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => ({ id: 'food-1', ...entity })),
    findOne: jest.fn(),
    remove: jest.fn(async (entity) => entity),
    createQueryBuilder: jest.fn(() => mockQueryBuilder(0, [])),
  };
}

type MockOpenFoodFactsClient = { searchByTerm: jest.Mock };

function mockOpenFoodFactsClient(): MockOpenFoodFactsClient {
  return { searchByTerm: jest.fn(async () => []) };
}

const baseDto = {
  name: 'Vitamina de banana caseira',
  kcalPer100g: 95,
  proteinGPer100g: 2.1,
  fatGPer100g: 1.5,
  carbGPer100g: 18,
};

describe('FoodsService', () => {
  let service: FoodsService;
  let repo: MockRepo;
  let openFoodFacts: MockOpenFoodFactsClient;

  beforeEach(() => {
    repo = mockRepo();
    openFoodFacts = mockOpenFoodFactsClient();
    service = new FoodsService(repo as never, openFoodFacts as never);
  });

  describe('create', () => {
    it('sempre grava source=custom e owner_user_id do usuário atual, nunca vindo do DTO', async () => {
      const result = await service.create('user-1', baseDto);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ source: FoodSource.CUSTOM, ownerUserId: 'user-1', externalId: null }),
      );
      expect(result.source).toBe(FoodSource.CUSTOM);
    });

    it('converte os macros numéricos pra string (coluna numeric)', async () => {
      await service.create('user-1', baseDto);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ kcalPer100g: '95', proteinGPer100g: '2.1', fatGPer100g: '1.5', carbGPer100g: '18' }),
      );
    });

    it('grava fiberGPer100g como null quando não informado', async () => {
      await service.create('user-1', baseDto);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ fiberGPer100g: null }));
    });
  });

  describe('findById', () => {
    it('lança NotFoundException quando o alimento não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('food-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('retorna alimento TACO pra qualquer usuário autenticado (público)', async () => {
      const tacoFood = { id: 'food-1', source: FoodSource.TACO, ownerUserId: null };
      repo.findOne.mockResolvedValue(tacoFood);
      await expect(service.findById('food-1', 'qualquer-usuario')).resolves.toBe(tacoFood);
    });

    it('lança NotFoundException pra alimento custom de outro usuário', async () => {
      const othersFood = { id: 'food-1', source: FoodSource.CUSTOM, ownerUserId: 'dono-original' };
      repo.findOne.mockResolvedValue(othersFood);
      await expect(service.findById('food-1', 'outro-usuario')).rejects.toThrow(NotFoundException);
    });

    it('retorna o alimento custom pro próprio dono', async () => {
      const ownFood = { id: 'food-1', source: FoodSource.CUSTOM, ownerUserId: 'dono' };
      repo.findOne.mockResolvedValue(ownFood);
      await expect(service.findById('food-1', 'dono')).resolves.toBe(ownFood);
    });
  });

  describe('update', () => {
    it('lança NotFoundException ao tentar editar alimento de outro dono', async () => {
      repo.findOne.mockResolvedValue({ id: 'food-1', ownerUserId: 'outro' });
      await expect(service.update('food-1', 'user-1', { name: 'Novo nome' })).rejects.toThrow(NotFoundException);
    });

    it('lança NotFoundException ao tentar editar alimento do sistema (TACO)', async () => {
      repo.findOne.mockResolvedValue({ id: 'food-1', ownerUserId: null, source: FoodSource.TACO });
      await expect(service.update('food-1', 'user-1', { name: 'Novo nome' })).rejects.toThrow(NotFoundException);
    });

    it('atualiza só os campos informados, preservando o resto', async () => {
      repo.findOne.mockResolvedValue({
        id: 'food-1',
        ownerUserId: 'user-1',
        name: 'Nome antigo',
        kcalPer100g: '100',
        brand: 'Marca antiga',
      });
      const result = await service.update('food-1', 'user-1', { name: 'Nome novo' });
      expect(result.name).toBe('Nome novo');
      expect(result.brand).toBe('Marca antiga');
      expect(result.kcalPer100g).toBe('100');
    });
  });

  describe('remove', () => {
    it('lança NotFoundException ao tentar remover alimento de outro dono', async () => {
      repo.findOne.mockResolvedValue({ id: 'food-1', ownerUserId: 'outro' });
      await expect(service.remove('food-1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('remove quando o usuário é o dono', async () => {
      const food = { id: 'food-1', ownerUserId: 'user-1' };
      repo.findOne.mockResolvedValue(food);
      await service.remove('food-1', 'user-1');
      expect(repo.remove).toHaveBeenCalledWith(food);
    });
  });

  describe('search', () => {
    it('retorna resultado local sem consultar o Open Food Facts quando encontra algo', async () => {
      const localFood = { id: 'food-1', name: 'Arroz, integral, cozido' };
      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder(1, [localFood]));

      const result = await service.search('user-1', { q: 'arros', page: 1, limit: 20 });

      expect(result.data).toEqual([localFood]);
      expect(result.meta.total).toBe(1);
      expect(openFoodFacts.searchByTerm).not.toHaveBeenCalled();
    });

    it('cai pro Open Food Facts quando a busca local não encontra nada', async () => {
      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder(0, []));
      openFoodFacts.searchByTerm.mockResolvedValue([
        { code: '123', product_name: 'Produto só no OFF', nutriments: { 'energy-kcal_100g': 100, proteins_100g: 1, fat_100g: 1, carbohydrates_100g: 1 } },
      ]);
      repo.findOne.mockResolvedValue(null); // não cacheado ainda

      const result = await service.search('user-1', { q: 'produto-raro', page: 1, limit: 20 });

      expect(openFoodFacts.searchByTerm).toHaveBeenCalledWith('produto-raro');
      expect(result.data).toHaveLength(1);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ source: FoodSource.OFF, externalId: '123', barcode: '123' }));
    });

    it('não recacheia (nem duplica) um produto do OFF já cacheado', async () => {
      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder(0, []));
      const existing = { id: 'food-2', source: FoodSource.OFF, externalId: '123' };
      repo.findOne.mockResolvedValue(existing);
      openFoodFacts.searchByTerm.mockResolvedValue([
        { code: '123', product_name: 'Já cacheado', nutriments: { 'energy-kcal_100g': 100, proteins_100g: 1, fat_100g: 1, carbohydrates_100g: 1 } },
      ]);

      const result = await service.search('user-1', { q: 'ja-cacheado', page: 1, limit: 20 });

      expect(result.data).toEqual([existing]);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('ignora produto do OFF sem um macro obrigatório (nunca fabrica 0)', async () => {
      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder(0, []));
      repo.findOne.mockResolvedValue(null);
      openFoodFacts.searchByTerm.mockResolvedValue([
        { code: '999', product_name: 'Sem proteína medida', nutriments: { 'energy-kcal_100g': 100, fat_100g: 1, carbohydrates_100g: 1 } } as OffProduct,
      ]);

      const result = await service.search('user-1', { q: 'incompleto', page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('ignora produto do OFF sem code ou sem nome', async () => {
      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder(0, []));
      openFoodFacts.searchByTerm.mockResolvedValue([{ product_name: 'Sem código' } as OffProduct]);

      const result = await service.search('user-1', { q: 'sem-codigo', page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
    });
  });
});
