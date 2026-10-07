import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useSlowNetwork } from './use-slow-network';

let finish: (value: string) => void = () => undefined;

function Probe() {
  useQuery({
    queryKey: ['lento'],
    queryFn: () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
    retry: false,
  });
  return <Text>{useSlowNetwork(1000) ? 'lento' : 'normal'}</Text>;
}

describe('useSlowNetwork', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('só avisa depois do limite, e some quando a requisição termina', async () => {
    await render(
      <QueryClientProvider client={new QueryClient()}>
        <Probe />
      </QueryClientProvider>,
    );

    expect(screen.getByText('normal')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(screen.getByText('lento')).toBeTruthy();

    await act(async () => {
      finish('ok');
    });
    // O React Query avisa os ouvintes num setTimeout; com relógio falso, é preciso avançar.
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText('normal')).toBeTruthy();
  });
});
