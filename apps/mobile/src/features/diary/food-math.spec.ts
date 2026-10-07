import { nutrientsFor, recentFoodsFrom } from './food-math';

const food = (id: string, name: string, kcal = '100') => ({
  id,
  name,
  source: 'taco' as const,
  kcalPer100g: kcal,
  proteinGPer100g: '10',
  fatGPer100g: '5',
  carbGPer100g: '20',
});

const entry = (foodId: string, name: string, quantity: string, id = foodId) => ({
  id,
  foodId,
  food: food(foodId, name),
  quantity,
});

const day = (...entries: ReturnType<typeof entry>[]) => ({
  meals: { breakfast: entries, lunch: [], dinner: [], snack: [] },
});

describe('nutrientsFor', () => {
  it('escala os valores por 100 g para a quantidade', () => {
    expect(nutrientsFor(food('1', 'Arroz', '128'), 150)).toEqual({
      kcal: 192,
      proteinG: 15,
      fatG: 7.5,
      carbG: 30,
    });
  });

  it('quantidade inválida dá zero', () => {
    expect(nutrientsFor(food('1', 'Arroz'), Number.NaN).kcal).toBe(0);
  });
});

describe('recentFoodsFrom', () => {
  it('lista do dia mais recente para o mais antigo, sem repetir alimento', () => {
    const days = [
      day(entry('a', 'Arroz', '150'), entry('f', 'Feijão', '80')),
      day(entry('a', 'Arroz', '200', 'a-antigo')),
      undefined,
      day(entry('b', 'Banana', '120')),
    ];

    const recents = recentFoodsFrom(days, 10);

    expect(recents.map((r) => r.food.name)).toEqual(['Arroz', 'Feijão', 'Banana']);
    // A quantidade que vale é a da vez mais recente.
    expect(recents[0]?.lastQuantity).toBe(150);
  });

  it('respeita o limite', () => {
    const days = [day(entry('a', 'A', '1'), entry('b', 'B', '1'), entry('c', 'C', '1'))];

    expect(recentFoodsFrom(days, 2)).toHaveLength(2);
  });
});
