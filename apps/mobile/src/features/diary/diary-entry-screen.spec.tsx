import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { AxiosRequestConfig } from 'axios';
import { AccessibilityInfo } from 'react-native';

import DiaryEntryScreen from '@/app/diary-entry';
import { customInstance } from '@/api/http-client';
import { savePendingItem } from '@/features/offline-queue/offline-queue';
import { rice } from '@/features/offline-queue/test-fixtures';

const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/api/http-client', () => ({ customInstance: jest.fn() }));
jest.mock('@/features/offline-queue/offline-queue', () => ({ savePendingItem: jest.fn() }));

const DATE = '2026-10-12';
const savedEntry = {
  id: 'entry-1',
  clientId: null,
  foodId: rice.id,
  food: rice,
  entryDate: DATE,
  mealType: 'lunch',
  quantity: '150',
  unit: 'grams',
  portionId: null,
  portion: null,
  kcalSnapshot: '192',
  proteinGSnapshot: '3.75',
  fatGSnapshot: '0.3',
  carbGSnapshot: '42',
  microsSnapshot: null,
};

/** API falsa por trás do client gerado: responde pela URL e guarda o que foi pedido. */
function fakeApi() {
  const api = jest.mocked(customInstance);
  api.mockImplementation(async (config: AxiosRequestConfig) => {
    const { url = '', method = 'GET' } = config;
    if (url === '/v1/foods/search') return { data: [rice], meta: { total: 1, page: 1, limit: 20 } } as never;
    if (url.endsWith('/portions')) return [] as never;
    if (url === '/v1/diary' && method === 'GET') {
      const isToday = (config.params as { date: string }).date === DATE;
      return {
        date: (config.params as { date: string }).date,
        meals: { breakfast: [], lunch: isToday ? [savedEntry] : [], dinner: [], snack: [] },
        summary: {},
      } as never;
    }
    return {} as never;
  });
  return api;
}

let client: QueryClient;

function renderScreen() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <DiaryEntryScreen />
    </QueryClientProvider>,
  );
}

describe('tela de anotar alimento', () => {
  afterEach(() => client.clear());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
  });

  it('busca, escolhe e anota com o id do aparelho, depois fecha', async () => {
    mockParams = { date: DATE, mealType: 'dinner' };
    fakeApi();
    jest.mocked(savePendingItem).mockResolvedValue('sent');
    await renderScreen();

    await userEvent.type(screen.getByTestId('diary-food-search'), 'arroz');
    await userEvent.press(await screen.findByText('Arroz cozido'));
    await userEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const item = jest.mocked(savePendingItem).mock.calls[0]?.[0];
    expect(item).toMatchObject({
      kind: 'diary',
      food: rice,
      data: { foodId: rice.id, date: DATE, mealType: 'dinner', quantity: 100, unit: 'grams' },
    });
    expect(item?.data.clientId).toBe(item?.clientId);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(expect.stringContaining('Arroz cozido'));
  });

  it('sem internet avisa que ficou guardado e fecha', async () => {
    mockParams = { date: DATE, mealType: 'dinner' };
    fakeApi();
    jest.mocked(savePendingItem).mockResolvedValue('queued');
    await renderScreen();

    await userEvent.type(screen.getByTestId('diary-food-search'), 'arroz');
    await userEvent.press(await screen.findByText('Arroz cozido'));
    await userEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      expect.stringContaining('ficou guardado no celular'),
    );
  });

  it('recusa do servidor mostra o erro e não fecha', async () => {
    mockParams = { date: DATE, mealType: 'dinner' };
    fakeApi();
    jest.mocked(savePendingItem).mockRejectedValue(new Error('recusado'));
    await renderScreen();

    await userEvent.type(screen.getByTestId('diary-food-search'), 'arroz');
    await userEvent.press(await screen.findByText('Arroz cozido'));
    await userEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText(/Não foi possível salvar/)).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('quantidade inválida não salva', async () => {
    mockParams = { date: DATE, mealType: 'dinner' };
    fakeApi();
    await renderScreen();

    await userEvent.type(screen.getByTestId('diary-food-search'), 'arroz');
    await userEvent.press(await screen.findByText('Arroz cozido'));
    await userEvent.clear(screen.getByDisplayValue('100'));
    await userEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(savePendingItem).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('editar muda a quantidade da anotação existente', async () => {
    mockParams = { date: DATE, id: 'entry-1', foodName: 'Arroz cozido', quantity: '150' };
    const api = fakeApi();
    await renderScreen();

    const field = await screen.findByDisplayValue('150');
    await userEvent.clear(field);
    await userEvent.type(field, '200');
    await userEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/v1/diary/entry-1', method: 'PATCH', data: { quantity: 200, unit: 'grams' } }),
    );
  });

  it('apagar remove a anotação e fecha', async () => {
    mockParams = { date: DATE, id: 'entry-1', foodName: 'Arroz cozido', quantity: '150' };
    const api = fakeApi();
    await renderScreen();

    await userEvent.press(await screen.findByRole('button', { name: /Arroz cozido/ }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: '/v1/diary/entry-1', method: 'DELETE' }));
  });
});
