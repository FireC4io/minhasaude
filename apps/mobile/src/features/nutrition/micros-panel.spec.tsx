import { sumMicros, type Micros } from '@minhasaude/shared';
import { render, screen, userEvent } from '@testing-library/react-native';

import { MicrosPanel } from './micros-panel';
import { rowsForDay, rowsForPortion } from './micros-rows';

const feijao: Micros = {
  fiberG: 8.51,
  sodiumMg: 1.76,
  potassiumMg: 254.62,
  calciumMg: 26.59,
  ironMg: 1.29,
  magnesiumMg: 42.34,
  zincMg: 0.7,
  vitaminCMg: 0,
  vitaminARaeMcg: null,
};

describe('MicrosPanel', () => {
  it('começa fechado e abre ao tocar', async () => {
    await render(<MicrosPanel title="Outros nutrientes" rows={rowsForPortion(feijao, 200)} />);

    expect(screen.queryByText('Ferro')).toBeNull();
    await userEvent.press(screen.getByRole('button', { name: 'Ver outros nutrientes' }));

    expect(screen.getByText('Ferro')).toBeTruthy();
    expect(screen.getByText('2,6 mg')).toBeTruthy();
    expect(screen.getByLabelText('Vitamina A: sem dado')).toBeTruthy();
  });

  it('no total do dia, avisa quando o número é parcial', async () => {
    const totals = sumMicros([feijao, null]);
    await render(<MicrosPanel title="Outros nutrientes do dia" rows={rowsForDay(totals)} initiallyOpen />);

    expect(screen.getAllByText('1 de 2 alimentos têm esse dado').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Vitamina A: sem dado. nenhum alimento tem esse dado')).toBeTruthy();
  });
});
