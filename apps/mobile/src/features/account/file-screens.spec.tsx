import { render, screen, userEvent } from '@testing-library/react-native';

import ExportDataScreen from '@/app/account/export';
import ProgressReportScreen from '@/app/account/report';
import { usersControllerExportData, usersControllerGetProgressReport } from '@/api/generated/endpoints/me/me';
import { saveExportFile } from '@/features/account/save-export-file';
import { shareReport } from '@/features/report/share-report';

jest.mock('@/api/generated/endpoints/me/me', () => ({
  usersControllerExportData: jest.fn(),
  usersControllerGetProgressReport: jest.fn(),
}));
jest.mock('@/features/account/save-export-file', () => ({ saveExportFile: jest.fn() }));
jest.mock('@/features/report/share-report', () => ({ shareReport: jest.fn() }));
jest.mock('@/features/report/progress-report', () => ({ buildProgressReport: jest.fn(() => ({})) }));
jest.mock('@/features/report/report-html', () => ({ renderReportHtml: jest.fn(() => '<html />') }));

describe('baixar meus dados', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gera o JSON, abre o compartilhar e confirma', async () => {
    jest.mocked(usersControllerExportData).mockResolvedValue({ account: { id: 'u1' } } as never);
    await render(<ExportDataScreen />);

    expect(screen.getByText('• Todo o seu diário de alimentação')).toBeOnTheScreen();
    // A lista acompanha o que a exportação leva de verdade (alimentos próprios, histórico de pedidos).
    expect(screen.getByText('• Os alimentos e as medidas que você cadastrou')).toBeOnTheScreen();
    expect(screen.getByText(/O histórico dos seus pedidos/)).toBeOnTheScreen();
    await userEvent.press(screen.getByRole('button', { name: 'Gerar meu arquivo' }));

    expect(saveExportFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.json$/),
      expect.stringContaining('"id": "u1"'),
      'Salvar meus dados do Gota Vital',
    );
    expect(await screen.findByText(/Arquivo pronto/)).toBeOnTheScreen();
  });

  it('sem internet explica e não confirma', async () => {
    jest.mocked(usersControllerExportData).mockRejectedValue(new Error('rede'));
    await render(<ExportDataScreen />);

    await userEvent.press(screen.getByRole('button', { name: 'Gerar meu arquivo' }));
    expect(await screen.findByText(/Não foi possível gerar o arquivo agora/)).toBeOnTheScreen();
    expect(screen.queryByText(/Arquivo pronto/)).toBeNull();
  });
});

describe('relatório de progresso', () => {
  beforeEach(() => jest.clearAllMocks());

  it('monta o PDF a partir dos dados e abre o compartilhar', async () => {
    jest.mocked(usersControllerGetProgressReport).mockResolvedValue({} as never);
    await render(<ProgressReportScreen />);

    expect(screen.getByText('• O diário completo, dia a dia e por refeição')).toBeOnTheScreen();
    await userEvent.press(screen.getByRole('button', { name: 'Gerar relatório em PDF' }));

    expect(shareReport).toHaveBeenCalledWith('<html />', 'Salvar relatório do Gota Vital');
    expect(await screen.findByText(/Relatório pronto/)).toBeOnTheScreen();
  });

  it('falha ao compartilhar mostra o erro', async () => {
    jest.mocked(usersControllerGetProgressReport).mockResolvedValue({} as never);
    jest.mocked(shareReport).mockRejectedValue(new Error('sem compartilhar'));
    await render(<ProgressReportScreen />);

    await userEvent.press(screen.getByRole('button', { name: 'Gerar relatório em PDF' }));
    expect(await screen.findByText(/Não foi possível gerar o relatório agora/)).toBeOnTheScreen();
  });
});
