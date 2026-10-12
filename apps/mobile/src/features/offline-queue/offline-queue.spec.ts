import { isPendingEntry, pendingClientId, pendingEntry, withPendingEntries } from './merge-pending';
import { createPendingStore } from './pending-store';
import { flushPending, saveOrQueue, type Sender } from './pending-sync';
import { sendOutcome } from './send-outcome';
import { axiosError, diaryItem, emptyDay, memoryStorage, weightItem } from './test-fixtures';

describe('sendOutcome', () => {
  it('sem resposta (sem internet, tempo esgotado) é offline', () => {
    expect(sendOutcome(axiosError())).toBe('offline');
  });

  it('servidor fora do ar, sessão renovando ou muitos pedidos: tenta de novo', () => {
    for (const status of [500, 502, 503, 401, 408, 429]) {
      expect(sendOutcome(axiosError(status))).toBe('retry');
    }
  });

  it('recusa do servidor (alimento apagado, sem consentimento) não se repete', () => {
    for (const status of [400, 403, 404, 409]) {
      expect(sendOutcome(axiosError(status))).toBe('reject');
    }
  });
});

describe('pending store', () => {
  it('guarda no aparelho e lê de volta ao abrir o app de novo', async () => {
    const storage = memoryStorage();
    const first = createPendingStore(storage);
    await first.init();
    await first.add(diaryItem('a'));
    await first.add(weightItem('b'));

    const reopened = createPendingStore(storage);
    await reopened.init();
    expect(reopened.getState().items.map((item) => item.clientId)).toEqual(['a', 'b']);
  });

  it('a mesma anotação não entra duas vezes', async () => {
    const store = createPendingStore(memoryStorage());
    await store.add(diaryItem('a'));
    await store.add(diaryItem('a'));
    expect(store.getState().items).toHaveLength(1);
  });

  it('o que foi anotado antes de a leitura terminar não se perde', async () => {
    const storage = memoryStorage();
    const old = createPendingStore(storage);
    await old.add(diaryItem('antiga'));

    const store = createPendingStore(storage);
    await store.add(diaryItem('nova'));
    await store.init();
    expect(store.getState().items.map((item) => item.clientId)).toEqual(['antiga', 'nova']);
  });

  it('cópia ilegível vira fila vazia, sem quebrar', async () => {
    const storage = memoryStorage();
    storage.data.set('gota-vital:pending-entries', '{quebrado');
    const store = createPendingStore(storage);
    await store.init();
    expect(store.getState()).toEqual({ items: [], failed: [] });
  });

  it('logout apaga a fila da memória e do aparelho', async () => {
    const storage = memoryStorage();
    const store = createPendingStore(storage);
    await store.add(diaryItem('a'));
    await store.clear();
    expect(store.getState().items).toEqual([]);
    expect(storage.data.size).toBe(0);
  });

  it('avisa quem está olhando a cada mudança', async () => {
    const store = createPendingStore(memoryStorage());
    await store.init();
    const listener = jest.fn();
    store.subscribe(listener);
    await store.add(diaryItem('a'));
    await store.remove('a');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('saveOrQueue', () => {
  it('com internet envia e não guarda nada', async () => {
    const store = createPendingStore(memoryStorage());
    const send: Sender = jest.fn().mockResolvedValue({});
    await expect(saveOrQueue(store, diaryItem('a'), send)).resolves.toBe('sent');
    expect(store.getState().items).toEqual([]);
  });

  it('sem internet guarda na fila', async () => {
    const store = createPendingStore(memoryStorage());
    const send: Sender = jest.fn().mockRejectedValue(axiosError());
    await expect(saveOrQueue(store, diaryItem('a'), send)).resolves.toBe('queued');
    expect(store.getState().items.map((item) => item.clientId)).toEqual(['a']);
  });

  it('servidor que não responde a tempo: desiste de esperar e guarda', async () => {
    jest.useFakeTimers();
    try {
      const store = createPendingStore(memoryStorage());
      // Como o axios: o pedido só termina quando o sinal cancela.
      const send: Sender = (_item, signal) =>
        new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(axiosError())));
      const result = saveOrQueue(store, diaryItem('a'), send, 1000);
      jest.advanceTimersByTime(1000);
      await expect(result).resolves.toBe('queued');
    } finally {
      jest.useRealTimers();
    }
  });

  it('recusa do servidor sobe como erro e não entra na fila', async () => {
    const store = createPendingStore(memoryStorage());
    const send: Sender = jest.fn().mockRejectedValue(axiosError(400));
    await expect(saveOrQueue(store, diaryItem('a'), send)).rejects.toThrow();
    expect(store.getState().items).toEqual([]);
  });
});

describe('flushPending', () => {
  it('envia na ordem em que foi anotado e esvazia a fila', async () => {
    const store = createPendingStore(memoryStorage());
    await store.add(diaryItem('a'));
    await store.add(weightItem('b'));
    const order: string[] = [];
    const send: Sender = async (item) => {
      order.push(item.clientId);
    };

    const sent = await flushPending(store, send);
    expect(order).toEqual(['a', 'b']);
    expect(sent.map((item) => item.clientId)).toEqual(['a', 'b']);
    expect(store.getState().items).toEqual([]);
  });

  it('sem resposta para de tentar e mantém o resto', async () => {
    const store = createPendingStore(memoryStorage());
    await store.add(diaryItem('a'));
    await store.add(diaryItem('b'));
    const send = jest.fn().mockRejectedValue(axiosError());

    expect(await flushPending(store, send)).toEqual([]);
    expect(send).toHaveBeenCalledTimes(1);
    expect(store.getState().items).toHaveLength(2);
  });

  it('erro passageiro mantém aquela e segue com as outras', async () => {
    const store = createPendingStore(memoryStorage());
    await store.add(diaryItem('a'));
    await store.add(diaryItem('b'));
    const send = jest.fn().mockRejectedValueOnce(axiosError(503)).mockResolvedValueOnce({});

    const sent = await flushPending(store, send);
    expect(sent.map((item) => item.clientId)).toEqual(['b']);
    expect(store.getState().items.map((item) => item.clientId)).toEqual(['a']);
  });

  it('recusada sai da fila e vira aviso com o nome do alimento', async () => {
    const store = createPendingStore(memoryStorage());
    await store.add(diaryItem('a'));
    const send = jest.fn().mockRejectedValue(axiosError(404));

    await flushPending(store, send);
    expect(store.getState().items).toEqual([]);
    expect(store.getState().failed).toEqual([{ clientId: 'a', kind: 'diary', label: 'Arroz cozido' }]);

    await store.dismissFailed('a');
    expect(store.getState().failed).toEqual([]);
  });

  it('duas chamadas ao mesmo tempo enviam uma vez só', async () => {
    const store = createPendingStore(memoryStorage());
    await store.add(diaryItem('a'));
    const send = jest.fn().mockResolvedValue({});

    await Promise.all([flushPending(store, send), flushPending(store, send)]);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('withPendingEntries', () => {
  it('a anotação guardada aparece na refeição e entra nas calorias', () => {
    const day = withPendingEntries(emptyDay(), [diaryItem('a', { quantity: 150 })]);
    const entry = day.meals.lunch[0] ?? pendingEntry(diaryItem('falhou'));

    expect(entry.food.name).toBe('Arroz cozido');
    expect(isPendingEntry(entry)).toBe(true);
    expect(pendingClientId(entry)).toBe('a');
    expect(day.summary.consumed.kcal).toBe(192);
    expect(day.summary.remaining?.kcal).toBe(1808);
  });

  it('medida caseira vira gramas pela medida', () => {
    const item = {
      ...diaryItem('a', { quantity: 2, unit: 'portion' as const, portionId: 'p1' }),
      portion: { id: 'p1', kind: null, label: 'colher de sopa', grams: '25', custom: false },
    };
    expect(withPendingEntries(emptyDay(), [item]).summary.consumed.kcal).toBe(64);
  });

  it('só entra no dia em que foi anotada', () => {
    const day = emptyDay('2026-10-11');
    expect(withPendingEntries(day, [diaryItem('a')])).toBe(day);
  });

  it('a que já chegou ao servidor (resposta perdida) não conta duas vezes', () => {
    const fromServer = { ...pendingEntry(diaryItem('a')), id: 'id-do-servidor' };
    const serverDay = { ...emptyDay(), meals: { ...emptyDay().meals, lunch: [fromServer] } };

    expect(withPendingEntries(serverDay, [diaryItem('a')])).toBe(serverDay);
  });

  it('sem meta, o que falta continua sem valor', () => {
    const base = emptyDay();
    const day = { ...base, summary: { ...base.summary, target: null, remaining: null } };
    expect(withPendingEntries(day, [diaryItem('a')]).summary.remaining).toBeNull();
  });
});
