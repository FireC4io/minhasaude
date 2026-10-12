import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent } from '@testing-library/react-native';

import { DiaryEntryRow } from '@/features/diary/diary-entry-row';

import { pendingEntry } from './merge-pending';
import { pendingStore } from './offline-queue';
import { PendingCard } from './pending-card';
import { diaryItem, weightItem } from './test-fixtures';

function renderCard() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <PendingCard />
    </QueryClientProvider>,
  );
}

describe('PendingCard', () => {
  beforeEach(async () => {
    await pendingStore.clear();
  });

  it('sem nada esperando, não aparece', async () => {
    await renderCard();
    expect(screen.queryByRole('header')).toBeNull();
  });

  it('lista o que espera a internet e deixa apagar cada um', async () => {
    await act(async () => {
      await pendingStore.add(diaryItem('a'));
      await pendingStore.add(weightItem('b', 71.5));
    });
    await renderCard();

    expect(screen.getByRole('header', { name: '2 anotações esperando a internet' })).toBeTruthy();
    expect(screen.getByText('Peso: 71,5 kg')).toBeTruthy();

    await userEvent.press(screen.getByLabelText('Apagar Peso: 71,5 kg'));
    expect(pendingStore.getState().items.map((item) => item.clientId)).toEqual(['a']);
    expect(screen.getByRole('header', { name: '1 anotação esperando a internet' })).toBeTruthy();
  });

  it('o que o servidor recusou vira aviso até a pessoa dispensar', async () => {
    await act(async () => {
      await pendingStore.add(diaryItem('a'));
      await pendingStore.fail(diaryItem('a'), 'Arroz cozido');
    });
    await renderCard();

    expect(screen.getByText('Arroz cozido não pôde ser salvo. Se ainda quiser, anote de novo.')).toBeTruthy();
    await userEvent.press(screen.getByText('Entendi'));
    expect(screen.queryByText('Entendi')).toBeNull();
  });
});

describe('DiaryEntryRow guardada sem internet', () => {
  it('avisa que espera a internet e não se abre para editar', async () => {
    const onPress = jest.fn();
    await render(<DiaryEntryRow entry={pendingEntry(diaryItem('a'))} onPress={onPress} onDelete={jest.fn()} />);

    expect(screen.getByText('Esperando a internet para enviar')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Arroz cozido, 100 gramas/ })).toBeNull();
    // "Remover" continua: tira da fila.
    expect(screen.getByRole('button', { name: /Remover Arroz cozido/ })).toBeTruthy();
  });
});
