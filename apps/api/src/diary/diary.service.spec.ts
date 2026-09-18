import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { MealType, DiaryQuantityUnit } from '../database/entities/diary-entry.entity';

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  remove: jest.Mock;
};

function mockRepo(): MockRepo {
  return {
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => ({ id: 'entry-1', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(async () => []),
    remove: jest.fn(async (entity) => entity),
  };
}

const food = {
  id: 'food-1',
  kcalPer100g: '200.00',
  proteinGPer100g: '10.00',
  fatGPer100g: '5.00',
  carbGPer100g: '20.00',
};

describe('DiaryService', () => {
  let service: DiaryService;
  let entries: MockRepo;
  let portions: MockRepo;
  let foodsService: { findById: jest.Mock };
  let goalsService: { getCurrent: jest.Mock };

  beforeEach(() => {
    entries = mockRepo();
    portions = mockRepo();
    foodsService = { findById: jest.fn(async () => food) };
    goalsService = { getCurrent: jest.fn() };
    service = new DiaryService(entries as never, portions as never, foodsService as never, goalsService as never);
  });

  describe('create', () => {
    it('calcula o snapshot a partir de 100g de referência do alimento (grams)', async () => {
      const result = await service.create('user-1', {
        foodId: 'food-1',
        date: '2026-09-18',
        mealType: MealType.LUNCH,
        quantity: 150,
        unit: DiaryQuantityUnit.GRAMS,
      });
      // 150g -> multiplicador 1.5
      expect(result.kcalSnapshot).toBe('300');
      expect(result.proteinGSnapshot).toBe('15');
      expect(result.fatGSnapshot).toBe('7.5');
      expect(result.carbGSnapshot).toBe('30');
    });

    it('calcula o snapshot a partir de porções (quantity * grams da porção)', async () => {
      portions.findOne.mockResolvedValue({ id: 'portion-1', foodId: 'food-1', grams: '50.00' });
      const result = await service.create('user-1', {
        foodId: 'food-1',
        date: '2026-09-18',
        mealType: MealType.SNACK,
        quantity: 2,
        unit: DiaryQuantityUnit.PORTION,
        portionId: 'portion-1',
      });
      // 2 porções de 50g = 100g -> multiplicador 1
      expect(result.kcalSnapshot).toBe('200');
    });

    it('rejeita unit=portion sem portionId', async () => {
      await expect(
        service.create('user-1', {
          foodId: 'food-1',
          date: '2026-09-18',
          mealType: MealType.SNACK,
          quantity: 1,
          unit: DiaryQuantityUnit.PORTION,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita porção que pertence a outro alimento', async () => {
      portions.findOne.mockResolvedValue({ id: 'portion-1', foodId: 'outro-alimento', grams: '50.00' });
      await expect(
        service.create('user-1', {
          foodId: 'food-1',
          date: '2026-09-18',
          mealType: MealType.SNACK,
          quantity: 1,
          unit: DiaryQuantityUnit.PORTION,
          portionId: 'portion-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('propaga o 404 do FoodsService quando o alimento não é visível pro usuário', async () => {
      foodsService.findById.mockRejectedValue(new NotFoundException());
      await expect(
        service.create('user-1', {
          foodId: 'food-alheio',
          date: '2026-09-18',
          mealType: MealType.LUNCH,
          quantity: 100,
          unit: DiaryQuantityUnit.GRAMS,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('lança NotFoundException pra entrada de outro usuário', async () => {
      entries.findOne.mockResolvedValue({ id: 'entry-1', userId: 'outro' });
      await expect(service.update('entry-1', 'user-1', { quantity: 100 })).rejects.toThrow(NotFoundException);
    });

    it('recalcula o snapshot quando quantity muda', async () => {
      entries.findOne.mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        foodId: 'food-1',
        quantity: '100.00',
        unit: DiaryQuantityUnit.GRAMS,
        portionId: null,
        mealType: MealType.LUNCH,
        entryDate: '2026-09-18',
      });
      const result = await service.update('entry-1', 'user-1', { quantity: 200 });
      expect(result.kcalSnapshot).toBe('400');
    });

    it('limpa portionId ao trocar unit pra grams', async () => {
      entries.findOne.mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        foodId: 'food-1',
        quantity: '2.00',
        unit: DiaryQuantityUnit.PORTION,
        portionId: 'portion-1',
        mealType: MealType.LUNCH,
        entryDate: '2026-09-18',
      });
      const result = await service.update('entry-1', 'user-1', { unit: DiaryQuantityUnit.GRAMS, quantity: 80 });
      expect(result.portionId).toBeNull();
    });

    it('não recalcula o snapshot se nada relevante mudou (só mealType)', async () => {
      entries.findOne.mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        foodId: 'food-1',
        quantity: '100.00',
        unit: DiaryQuantityUnit.GRAMS,
        portionId: null,
        mealType: MealType.LUNCH,
        entryDate: '2026-09-18',
        kcalSnapshot: '999.00',
      });
      const result = await service.update('entry-1', 'user-1', { mealType: MealType.DINNER });
      expect(result.kcalSnapshot).toBe('999.00');
      expect(foodsService.findById).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('lança NotFoundException pra entrada de outro usuário', async () => {
      entries.findOne.mockResolvedValue({ id: 'entry-1', userId: 'outro' });
      await expect(service.remove('entry-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByDate', () => {
    it('agrupa por refeição e soma os snapshots, não os dados atuais do alimento', async () => {
      entries.find.mockResolvedValue([
        {
          mealType: MealType.BREAKFAST,
          kcalSnapshot: '100.00',
          proteinGSnapshot: '5.00',
          fatGSnapshot: '2.00',
          carbGSnapshot: '10.00',
        },
        {
          mealType: MealType.BREAKFAST,
          kcalSnapshot: '50.00',
          proteinGSnapshot: '2.50',
          fatGSnapshot: '1.00',
          carbGSnapshot: '5.00',
        },
      ]);
      goalsService.getCurrent.mockRejectedValue(new NotFoundException());

      const result = await service.getByDate('user-1', '2026-09-18');
      expect(result.meals.breakfast).toHaveLength(2);
      expect(result.summary.consumed).toEqual({ kcal: 150, proteinG: 7.5, fatG: 3, carbG: 15 });
      expect(result.summary.target).toBeNull();
      expect(result.summary.remaining).toBeNull();
    });

    it('calcula remaining a partir da meta ativa quando ela existe', async () => {
      entries.find.mockResolvedValue([
        { mealType: MealType.LUNCH, kcalSnapshot: '500', proteinGSnapshot: '30', fatGSnapshot: '10', carbGSnapshot: '50' },
      ]);
      goalsService.getCurrent.mockResolvedValue({ targetKcal: '2000', proteinG: '150', fatG: '60', carbG: '250' });

      const result = await service.getByDate('user-1', '2026-09-18');
      expect(result.summary.target).toEqual({ kcal: 2000, proteinG: 150, fatG: 60, carbG: 250 });
      expect(result.summary.remaining).toEqual({ kcal: 1500, proteinG: 120, fatG: 50, carbG: 200 });
    });
  });

  describe('copy', () => {
    it('recria as entradas do dia de origem no dia de destino, resnapshotando a partir do alimento atual', async () => {
      entries.find.mockResolvedValue([
        {
          foodId: 'food-1',
          entryDate: '2026-09-17',
          mealType: MealType.DINNER,
          quantity: '100.00',
          unit: DiaryQuantityUnit.GRAMS,
          portionId: null,
        },
      ]);
      const result = await service.copy('user-1', { fromDate: '2026-09-17', toDate: '2026-09-18' });
      expect(result).toHaveLength(1);
      expect(entries.create).toHaveBeenCalledWith(expect.objectContaining({ entryDate: '2026-09-18', kcalSnapshot: '200' }));
    });
  });
});
