import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { getRandomBytes } from 'expo-crypto';

/** O pedaço do AsyncStorage que o persister do React Query usa. */
export interface PlainStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Onde a chave mora (SecureStore no aparelho: Keystore do Android). */
export interface KeyStore {
  get(): Promise<string | null>;
  set(hexKey: string): Promise<void>;
  remove(): Promise<void>;
}

export interface EncryptedStorage extends PlainStorage {
  /** Apaga a chave: o que sobrar da cópia fica ilegível para sempre. */
  forgetKey(): Promise<void>;
}

const FORMAT = 'v1:';
const KEY_BYTES = 32;
const NONCE_BYTES = 24;

/**
 * Cópia local do cache cifrada com XChaCha20-Poly1305 (achado 4 da avaliação
 * de segurança). Nonce aleatório de 24 bytes a cada gravação; a etiqueta
 * Poly1305 recusa cifrado alterado. Qualquer falha ao ler (cópia antiga sem
 * criptografia, chave perdida, dado corrompido) vira "sem cópia": o app só
 * busca de novo na API.
 */
export function createEncryptedStorage(
  storage: PlainStorage,
  keyStore: KeyStore,
  randomBytes: (size: number) => Uint8Array = getRandomBytes,
): EncryptedStorage {
  async function existingKey(): Promise<Uint8Array | null> {
    const hex = await keyStore.get();
    return hex && /^[0-9a-f]{64}$/.test(hex) ? hexToBytes(hex) : null;
  }

  async function keyForWriting(): Promise<Uint8Array> {
    const current = await existingKey();
    if (current) return current;
    const created = randomBytes(KEY_BYTES);
    await keyStore.set(bytesToHex(created));
    return created;
  }

  return {
    async getItem(name) {
      const stored = await storage.getItem(name);
      if (stored === null) return null;
      if (!stored.startsWith(FORMAT)) {
        // Cópia de antes da criptografia: não se lê dado de saúde em claro.
        await storage.removeItem(name);
        return null;
      }
      const key = await existingKey();
      if (!key) return null;
      try {
        const payload = fromBase64(stored.slice(FORMAT.length));
        const nonce = payload.subarray(0, NONCE_BYTES);
        const sealed = payload.subarray(NONCE_BYTES);
        return bytesToUtf8(xchacha20poly1305(key, nonce).decrypt(sealed));
      } catch {
        return null;
      }
    },

    async setItem(name, value) {
      const key = await keyForWriting();
      const nonce = randomBytes(NONCE_BYTES);
      const sealed = xchacha20poly1305(key, nonce).encrypt(utf8ToBytes(value));
      const payload = new Uint8Array(nonce.length + sealed.length);
      payload.set(nonce);
      payload.set(sealed, nonce.length);
      await storage.setItem(name, FORMAT + toBase64(payload));
    },

    removeItem: (name) => storage.removeItem(name),

    forgetKey: () => keyStore.remove(),
  };
}

// Base64 em vez de hex: a cópia ocupa metade do espaço. btoa/atob existem no Hermes.
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
