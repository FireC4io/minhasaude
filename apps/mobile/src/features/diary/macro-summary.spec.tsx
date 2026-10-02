import { render, screen } from '@testing-library/react-native';

import { MacroSummary } from './macro-summary';

const PROPS = {
  consumed: { kcal: 1200, proteinG: 50, fatG: 40, carbG: 150 },
  target: { kcal: 2480, proteinG: 120, fatG: 70, carbG: 300 },
  remaining: { kcal: 1280, proteinG: 70, fatG: 30, carbG: 150 },
};

describe('MacroSummary', () => {
  it('o card inteiro é uma parada só, lida como frase completa', async () => {
    await render(<MacroSummary {...PROPS} />);

    expect(
      screen.getByLabelText(
        'Consumido: 1.200 de 2.480 quilocalorias, faltam 1.280. ' +
          'Proteína: 50 de 120 gramas. Gordura: 40 de 70 gramas. Carboidrato: 150 de 300 gramas.',
      ),
    ).toBeTruthy();
  });

  it('não diz "hoje" — o diário também mostra outros dias', async () => {
    await render(<MacroSummary {...PROPS} />);

    expect(screen.getByText('1280 kcal restantes')).toBeTruthy();
  });
});
