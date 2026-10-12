import { MICRONUTRIENT_KEYS } from '@minhasaude/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { AxiosRequestConfig } from 'axios';
import { AccessibilityInfo } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TodayScreen from '@/app/(app)/index';
import { customInstance } from '@/api/http-client';
import { addDaysToIsoDate, todayIsoDate } from '@/features/diary/date-utils';
import { pendingStore } from '@/features/offline-queue/offline-queue';
import { diaryItem, rice } from '@/features/offline-queue/test-fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/api/http-client', () => ({ customInstance: jest.fn() }));

const TODAY = todayIsoDate();
const YESTERDAY = addDaysToIsoDate(TODAY, -1);
const METRICS = { frame: { x: 0, y: 0, width: 400, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

const entry = (id: string, date: string) => ({
  id,
  clientId: null,
  foodId: rice.id,
  food: rice,
  entryDate: date,
  mealType: 'lunch',
  quantity: '100',
  unit: 'grams',
  portionId: null,
  portion: null,
  kcalSnapshot: '128',
  proteinGSnapshot: '2.5',
  fatGSnapshot: '0.2',
  carbGSnapshot: '28',
  microsSnapshot: null,
});

const totals = (kcal: number) => ({ kcal, proteinG: 0, fatG: 0, carbG: 0 });
const micros = Object.fromEntries(MICRONUTRIENT_KEYS.map((key) => [key, { amount: 0, itemsWithData: 0, items: 0 }]));

function day(date: string, lunch: ReturnType<typeof entry>[]) {
  const kcal = lunch.length * 128;
  return {
    date,
    meals: { breakfast: [], lunch, dinner: [], snack: [] },
    summary: { consumed: totals(kcal), target: totals(2000), remaining: totals(2000 - kcal), micros },
  };
}

/** Dias do diário na API falsa: hoje e ontem podem ter anotação, o resto é vazio. */
function fakeApi(days: { today: ReturnType<typeof entry>[]; yesterday: ReturnType<typeof entry>[] }) {
  const api = jest.mocked(customInstance);
  api.mockImplementation(async (config: AxiosRequestConfig) => {
    const { url = '', method = 'GET' } = config;
    if (url === '/v1/diary' && method === 'GET') {
      const date = (config.params as { date: string }).date;
      if (date === TODAY) return day(date, days.today) as never;
      if (date === YESTERDAY) return day(date, days.yesterday) as never;
      return day(date, []) as never;
    }
    if (url === '/v1/body-measurements') return { data: [], meta: { total: 0, page: 1, limit: 1 } } as never;
    return {} as never;
  });
  return api;
}

let client: QueryClient;

function renderToday() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <QueryClientProvider client={client}>
        <TodayScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('tela Hoje', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
    await pendingStore.clear();
  });
  afterEach(() => client.clear());

  it('mostra as refeições e as calorias do dia', async () => {
    fakeApi({ today: [entry('e1', TODAY)], yesterday: [] });
    await renderToday();

    expect(await screen.findByText('Arroz cozido')).toBeOnTheScreen();
    expect(screen.getByText('128 / 2000')).toBeOnTheScreen();
  });

  it('remover apaga na API e oferece desfazer, que anota de novo', async () => {
    const api = fakeApi({ today: [entry('e1', TODAY)], yesterday: [] });
    await renderToday();

    await userEvent.press(await screen.findByRole('button', { name: /Remover Arroz cozido/ }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: '/v1/diary/e1', method: 'DELETE' })),
    );

    await userEvent.press(await screen.findByText('Desfazer'));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/v1/diary',
          method: 'POST',
          data: { foodId: rice.id, date: TODAY, mealType: 'lunch', quantity: 100, unit: 'grams' },
        }),
      ),
    );
  });

  it('dia vazio com ontem anotado oferece copiar o dia anterior', async () => {
    const api = fakeApi({ today: [], yesterday: [entry('e0', YESTERDAY)] });
    await renderToday();

    await userEvent.press(await screen.findByText('Copiar as refeições do dia anterior'));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/v1/diary/copy', method: 'POST', data: { fromDate: YESTERDAY, toDate: TODAY } }),
      ),
    );
  });

  it('tocar numa anotação abre a edição; a guardada sem internet não abre', async () => {
    fakeApi({ today: [entry('e1', TODAY)], yesterday: [] });
    await pendingStore.add(diaryItem('p1', { date: TODAY, mealType: 'dinner' }));
    await renderToday();

    await userEvent.press(await screen.findByRole('button', { name: /^Arroz cozido, 100 gramas/ }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/diary-entry',
      params: { id: 'e1', date: TODAY, foodName: 'Arroz cozido', quantity: '100' },
    });

    expect(screen.getByText('Esperando a internet para enviar')).toBeOnTheScreen();
    expect(screen.getByText('256 / 2000')).toBeOnTheScreen();
  });
});
