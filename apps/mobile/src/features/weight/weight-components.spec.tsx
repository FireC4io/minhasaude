import { render, screen } from '@testing-library/react-native';

import type { BodyMeasurementResponseDto } from '@/api/generated/models';
import { WeightChart } from './weight-chart';
import { WeightHistoryList } from './weight-history-list';

// Meio-dia UTC: a data fica a mesma em qualquer fuso do Brasil.
const MEDICOES = [
  { id: 'm1', measuredAt: '2026-09-01T12:00:00.000Z', weightKg: '70.00', source: 'manual' },
  { id: 'm2', measuredAt: '2026-09-20T12:00:00.000Z', weightKg: '68.50', source: 'manual' },
] as unknown as BodyMeasurementResponseDto[];

describe('WeightChart', () => {
  it('o SVG ganha uma descrição textual da tendência', async () => {
    await render(<WeightChart measurements={MEDICOES} />);

    expect(screen.getByRole('image')).toHaveProp(
      'accessibilityLabel',
      expect.stringContaining('Mais recente: 68,5 quilos, redução de 1,5 quilo.'),
    );
  });

  it('sem medições, o estado vazio é texto comum e não uma imagem muda', async () => {
    await render(<WeightChart measurements={[]} />);

    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.getByText(/Nenhum peso neste período/)).toBeTruthy();
  });
});

describe('WeightHistoryList', () => {
  it('tem cabeçalho e lê cada linha com data por extenso e unidade', async () => {
    await render(<WeightHistoryList measurements={MEDICOES} />);

    expect(screen.getByRole('header', { name: 'Histórico' })).toBeTruthy();
    expect(screen.getByLabelText('20 de setembro de 2026, 68,5 quilos')).toBeTruthy();
    expect(screen.getByLabelText('1 de setembro de 2026, 70 quilos')).toBeTruthy();
  });
});
