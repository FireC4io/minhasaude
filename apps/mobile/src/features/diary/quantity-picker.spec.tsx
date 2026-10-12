import { render, screen, userEvent } from '@testing-library/react-native';

import { GRAMS, type Measure } from './measures';
import { QuantityPicker } from './quantity-picker';

const arroz = {
  kcalPer100g: '128',
  proteinGPer100g: '2.5',
  fatGPer100g: '0.2',
  carbGPer100g: '28.1',
  micros: {},
};
const colher: Measure = {
  type: 'portion',
  portion: { id: 'p-1', kind: 'tablespoon', label: null, grams: '25.00', custom: false },
};

function montar(measure: Measure, value: string, handlers: { onMeasureChange?: jest.Mock; onChange?: jest.Mock } = {}) {
  return (
    <QuantityPicker
      food={arroz as never}
      measures={[GRAMS, colher]}
      measure={measure}
      onMeasureChange={handlers.onMeasureChange ?? jest.fn()}
      value={value}
      onChange={handlers.onChange ?? jest.fn()}
      onSubmit={jest.fn()}
    />
  );
}

describe('QuantityPicker', () => {
  it('oferece as medidas do alimento, com o peso falado por extenso', async () => {
    const onMeasureChange = jest.fn();
    await render(montar(GRAMS, '100', { onMeasureChange }));

    const opcao = screen.getByRole('radio', { name: 'Colher de sopa, 25 gramas' });
    await userEvent.press(opcao);

    expect(onMeasureChange).toHaveBeenCalledWith(colher);
    expect(screen.getByRole('radio', { name: 'Gramas' })).toBeChecked();
  });

  it('na medida caseira, a conta usa o peso da medida e mostra os gramas', async () => {
    await render(montar(colher, '2'));

    // 2 colheres de 25 g = 50 g de arroz = 64 kcal
    expect(screen.getByText('64 kcal')).toBeOnTheScreen();
    expect(screen.getByText(/^50 g · /)).toBeOnTheScreen();
    expect(screen.getByText('As medidas caseiras são aproximadas. Para mais exatidão, use gramas.')).toBeOnTheScreen();
  });

  it('atalhos acompanham a medida: meia colher, 1, 2, 3', async () => {
    const onChange = jest.fn();
    await render(montar(colher, '1', { onChange }));

    await userEvent.press(screen.getByRole('button', { name: '0,5 colher de sopa' }));
    expect(onChange).toHaveBeenCalledWith('0.5');
    expect(screen.getByRole('button', { name: '3 colheres de sopa' })).toBeOnTheScreen();
  });

  it('sem medida caseira (ou sem internet), não mostra escolha: só gramas', async () => {
    await render(
      <QuantityPicker
        food={arroz as never}
        measures={[GRAMS]}
        measure={GRAMS}
        onMeasureChange={jest.fn()}
        value="100"
        onChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.getByRole('button', { name: '50 gramas' })).toBeOnTheScreen();
  });
});
