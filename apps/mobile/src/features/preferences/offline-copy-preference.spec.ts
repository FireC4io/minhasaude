import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  MAX_OFFLINE_COPY_MS,
  loadOfflineCopyDays,
  offlineCopyMaxAgeMs,
  saveOfflineCopyDays,
} from './offline-copy-preference';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('tempo da cópia no aparelho', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sem escolha, guarda por 1 dia (como antes)', async () => {
    expect(await loadOfflineCopyDays()).toBe('1');
  });

  it('guarda e devolve a escolha', async () => {
    await saveOfflineCopyDays('30');

    expect(await loadOfflineCopyDays()).toBe('30');
  });

  it('valor fora das opções volta ao padrão — nunca passa de 30 dias', async () => {
    await AsyncStorage.setItem('gota-vital:offline-copy-days', '365');

    expect(await loadOfflineCopyDays()).toBe('1');
  });

  it('converte dias em milissegundos, com teto de 30 dias', () => {
    expect(offlineCopyMaxAgeMs('1')).toBe(DAY_MS);
    expect(offlineCopyMaxAgeMs('7')).toBe(7 * DAY_MS);
    expect(offlineCopyMaxAgeMs('30')).toBe(30 * DAY_MS);
    expect(MAX_OFFLINE_COPY_MS).toBe(30 * DAY_MS);
  });
});
