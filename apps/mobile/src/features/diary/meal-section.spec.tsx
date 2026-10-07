import { render, screen, userEvent } from '@testing-library/react-native';

import type { DiaryEntryResponseDto } from '@/api/generated/models';
import { MealSection } from './meal-section';

function entry(overrides: Partial<DiaryEntryResponseDto> = {}): DiaryEntryResponseDto {
  return {
    id: 'entry-1',
    date: '2026-09-25',
    mealType: 'lunch',
    quantity: '130',
    unit: 'grams',
    portionId: null,
    kcalSnapshot: '127.6',
    proteinGSnapshot: '1.7',
    fatGSnapshot: '0.1',
    carbGSnapshot: '33.8',
    food: { id: 'food-1', name: 'Banana, prata, crua', brand: null, source: 'taco' },
    ...overrides,
  } as DiaryEntryResponseDto;
}

interface Handlers {
  onEntryPress?: jest.Mock;
  onEntryDelete?: jest.Mock;
  onAddPress?: jest.Mock;
}

function montar(entries: DiaryEntryResponseDto[], handlers: Handlers = {}) {
  return (
    <MealSection
      mealType="lunch"
      entries={entries}
      onEntryPress={handlers.onEntryPress ?? jest.fn()}
      onEntryDelete={handlers.onEntryDelete ?? jest.fn()}
      onAddPress={handlers.onAddPress ?? jest.fn()}
    />
  );
}

describe('MealSection', () => {
  it('o cabeçalho da refeição é um header com o total falado', async () => {
    await render(montar([entry()]));

    expect(
      screen.getByRole('header', { name: 'Almoço, 1 alimento, 128 quilocalorias' }),
    ).toBeTruthy();
  });

  it('refeição vazia avisa que não há nada registrado', async () => {
    await render(montar([]));

    expect(screen.getByRole('header', { name: 'Almoço, nenhum alimento anotado' })).toBeTruthy();
  });

  it('a linha é lida como uma frase só e abre a edição', async () => {
    const onEntryPress = jest.fn();
    await render(montar([entry()], { onEntryPress }));

    await userEvent.press(
      screen.getByRole('button', { name: 'Banana, prata, crua, 130 gramas, 128 quilocalorias' }),
    );

    expect(onEntryPress).toHaveBeenCalledTimes(1);
  });

  it('cada "Remover" diz qual alimento remove', async () => {
    const arroz = entry({
      id: 'entry-2',
      food: { id: 'food-2', name: 'Arroz, tipo 1, cozido', brand: null, source: 'taco' },
    } as Partial<DiaryEntryResponseDto>);
    await render(montar([entry(), arroz]));

    expect(screen.getByRole('button', { name: 'Remover Banana, prata, crua' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remover Arroz, tipo 1, cozido' })).toBeTruthy();
  });

  it('o "+ Adicionar" diz em qual refeição adiciona', async () => {
    const onAddPress = jest.fn();
    await render(montar([], { onAddPress }));

    await userEvent.press(screen.getByRole('button', { name: 'Adicionar alimento ao almoço' }));

    expect(onAddPress).toHaveBeenCalledTimes(1);
  });
});
