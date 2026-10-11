import { createEncryptedStorage, type KeyStore, type PlainStorage } from './encrypted-storage';

function memoryStorage(): PlainStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

function memoryKeyStore(): KeyStore & { value: string | null } {
  const store = {
    value: null as string | null,
    get: async () => store.value,
    set: async (value: string) => {
      store.value = value;
    },
    remove: async () => {
      store.value = null;
    },
  };
  return store;
}

const CACHE = 'gota-vital:query-cache';
const HEALTH_DATA = JSON.stringify({ peso: 72.4, diario: ['Arroz, integral, cozido'] });

describe('cópia local cifrada', () => {
  it('guarda cifrado e devolve o original', async () => {
    const storage = memoryStorage();
    const encrypted = createEncryptedStorage(storage, memoryKeyStore());

    await encrypted.setItem(CACHE, HEALTH_DATA);

    const raw = storage.data.get(CACHE)!;
    expect(raw.startsWith('v1:')).toBe(true);
    expect(raw).not.toContain('Arroz');
    expect(raw).not.toContain('72.4');
    expect(await encrypted.getItem(CACHE)).toBe(HEALTH_DATA);
  });

  it('cria a chave na primeira gravação e reaproveita depois', async () => {
    const keys = memoryKeyStore();
    const encrypted = createEncryptedStorage(memoryStorage(), keys);

    await encrypted.setItem(CACHE, 'a');
    const first = keys.value;
    await encrypted.setItem(CACHE, 'b');

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(keys.value).toBe(first);
  });

  it('cada gravação usa um nonce novo (o mesmo texto não gera o mesmo cifrado)', async () => {
    const storage = memoryStorage();
    const encrypted = createEncryptedStorage(storage, memoryKeyStore());
    await encrypted.setItem('a', HEALTH_DATA);
    await encrypted.setItem('b', HEALTH_DATA);
    expect(storage.data.get('a')).not.toBe(storage.data.get('b'));
  });

  it('cópia antiga sem criptografia é descartada, não lida', async () => {
    const storage = memoryStorage();
    storage.data.set(CACHE, HEALTH_DATA);
    const encrypted = createEncryptedStorage(storage, memoryKeyStore());

    expect(await encrypted.getItem(CACHE)).toBeNull();
    expect(storage.data.has(CACHE)).toBe(false);
  });

  it('cifrado alterado ou com outra chave vira "sem cópia", sem quebrar o app', async () => {
    const storage = memoryStorage();
    const keys = memoryKeyStore();
    const encrypted = createEncryptedStorage(storage, keys);
    await encrypted.setItem(CACHE, HEALTH_DATA);

    const raw = storage.data.get(CACHE)!;
    storage.data.set(CACHE, raw.slice(0, -4) + (raw.endsWith('AAAA') ? 'BBBB' : 'AAAA'));
    expect(await encrypted.getItem(CACHE)).toBeNull();

    await encrypted.setItem(CACHE, HEALTH_DATA);
    keys.value = 'f'.repeat(64);
    expect(await encrypted.getItem(CACHE)).toBeNull();
  });

  it('apagar a chave deixa qualquer resto da cópia ilegível', async () => {
    const storage = memoryStorage();
    const keys = memoryKeyStore();
    const encrypted = createEncryptedStorage(storage, keys);
    await encrypted.setItem(CACHE, HEALTH_DATA);

    await encrypted.forgetKey();

    expect(keys.value).toBeNull();
    expect(await encrypted.getItem(CACHE)).toBeNull();
  });

  it('sem chave guardada, ler não cria chave nem devolve nada', async () => {
    const keys = memoryKeyStore();
    const encrypted = createEncryptedStorage(memoryStorage(), keys);
    expect(await encrypted.getItem(CACHE)).toBeNull();
    expect(keys.value).toBeNull();
  });
});
