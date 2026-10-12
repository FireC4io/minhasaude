import { render, screen, userEvent } from '@testing-library/react-native';

import UploadExamScreen from '@/app/exam/upload';
import { previewExamRepository, useExamDocuments } from '@/features/exams/exam-repository';
import { pickExamImage, pickExamPdf, takeExamPhoto } from '@/features/exams/pick-exam-file';
import type { ExamDocument } from '@/features/exams/types';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }) }));
jest.mock('@/features/exams/exam-repository', () => ({
  useExamDocuments: jest.fn(() => []),
  previewExamRepository: { upload: jest.fn(() => ({ id: 'envio-1' })) },
}));
jest.mock('@/features/exams/pick-exam-file', () => ({
  ...jest.requireActual('@/features/exams/pick-exam-file'),
  takeExamPhoto: jest.fn(),
  pickExamImage: jest.fn(),
  pickExamPdf: jest.fn(),
}));

const pdf = { uri: 'file:///laudo.pdf', name: 'laudo.pdf', mimeType: 'application/pdf', sizeBytes: 2048, kind: 'pdf' as const };

describe('tela de envio de exame', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exame de sangue: escolhe o PDF e envia como laboratório', async () => {
    jest.mocked(pickExamPdf).mockResolvedValue({ status: 'picked', file: pdf });
    await render(<UploadExamScreen />);

    await userEvent.press(screen.getByRole('radio', { name: /Exame de sangue/ }));
    await userEvent.press(screen.getByText('Escolher arquivo PDF'));
    expect(await screen.findByText(/laudo\.pdf/)).toBeOnTheScreen();

    await userEvent.press(screen.getByRole('button', { name: 'Enviar exame' }));
    expect(previewExamRepository.upload).toHaveBeenCalledWith({
      examType: 'blood_panel',
      deviceSource: 'lab_generic',
      fileName: 'laudo.pdf',
    });
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/exam/[id]', params: { id: 'envio-1' } });
  });

  it('bioimpedância sem aparelho escolhido não envia', async () => {
    jest.mocked(pickExamPdf).mockResolvedValue({ status: 'picked', file: pdf });
    await render(<UploadExamScreen />);

    await userEvent.press(screen.getByRole('radio', { name: /Bioimpedância/ }));
    await userEvent.press(screen.getByText('Escolher arquivo PDF'));
    await userEvent.press(await screen.findByRole('button', { name: 'Enviar exame' }));

    expect(screen.getByText(/Escolha o aparelho da bioimpedância/)).toBeOnTheScreen();
    expect(previewExamRepository.upload).not.toHaveBeenCalled();
  });

  it('arquivo grande demais e câmera negada mostram o motivo', async () => {
    jest.mocked(pickExamImage).mockResolvedValue({
      status: 'picked',
      file: { ...pdf, kind: 'image', name: 'foto.jpg', sizeBytes: 11 * 1024 * 1024 },
    });
    jest.mocked(takeExamPhoto).mockResolvedValue({ status: 'denied' });
    await render(<UploadExamScreen />);

    await userEvent.press(screen.getByRole('radio', { name: /Exame de sangue/ }));
    await userEvent.press(screen.getByText('Escolher foto da galeria'));
    expect(await screen.findByText(/Arquivo grande demais/)).toBeOnTheScreen();

    await userEvent.press(screen.getByText('Tirar foto do exame'));
    expect(await screen.findByText(/Sem permissão para usar a câmera/)).toBeOnTheScreen();
  });

  it('com envio do mesmo tipo há menos de 30 dias, avisa a data e não oferece enviar', async () => {
    const recent = { examType: 'blood_panel', uploadedAt: new Date().toISOString() } as ExamDocument;
    jest.mocked(useExamDocuments).mockReturnValue([recent]);
    await render(<UploadExamScreen />);

    await userEvent.press(screen.getByRole('radio', { name: /Exame de sangue/ }));
    expect(screen.getByText('Você já enviou um exame deste tipo neste mês')).toBeOnTheScreen();
    expect(screen.queryByText('Escolher arquivo PDF')).toBeNull();
  });
});
