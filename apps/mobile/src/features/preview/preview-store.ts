import { useSyncExternalStore } from 'react';

/**
 * Armazenamento das telas em prévia (água, notas, exames de demonstração):
 * só na memória, some ao fechar o app. É de propósito — não existe API para
 * esses dados ainda, e guardar no aparelho criaria dado de saúde fora do
 * export e da exclusão de conta (LGPD).
 */
type Listener = () => void;

const values = new Map<string, unknown>();
const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readPreviewValue<T>(key: string, fallback: T): T {
  return values.has(key) ? (values.get(key) as T) : fallback;
}

export function writePreviewValue<T>(key: string, value: T): void {
  values.set(key, value);
  listeners.forEach((listener) => listener());
}

export function usePreviewValue<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(subscribe, () => readPreviewValue(key, fallback));
  return [value, (next: T) => writePreviewValue(key, next)];
}

/** Para testes. */
export function resetPreviewStore(): void {
  values.clear();
  listeners.forEach((listener) => listener());
}
