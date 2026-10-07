import { render, screen } from '@testing-library/react-native';

import { LoadingIndicator } from './loading-indicator';

describe('LoadingIndicator', () => {
  it('diz o que está carregando', async () => {
    await render(<LoadingIndicator label="Carregando o diário" />);

    expect(screen.getByRole('progressbar', { name: 'Carregando o diário' })).toBeTruthy();
  });

  // Achado do catálogo (F4-08): o spinner usava o azul padrão do sistema.
  it('usa a cor de ação da paleta', async () => {
    await render(<LoadingIndicator label="Carregando o diário" />);

    expect(screen.getByTestId('loading-indicator-spinner').props.className).toContain(
      'text-mamao-forte',
    );
  });
});
