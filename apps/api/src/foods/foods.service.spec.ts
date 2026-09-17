import { NotFoundException } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { FoodSource } from '../database/entities/food.entity';

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
};

function mockRepo(): MockRepo {
  return {
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => ({ id: 'food-1', ...entity })),
    findOne: jest.fn(),
    remove: jest.fn(async (entity) => entity),
  };
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

  beforeEach(() => {
    repo = mockRepo();
    service = new FoodsService(repo as never);
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
});
