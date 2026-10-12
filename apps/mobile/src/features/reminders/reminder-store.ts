import { useSyncExternalStore } from 'react';

import { cancelAllReminders } from './reminder-scheduler';

import {
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  removeReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from './reminder-settings';

/**
 * As escolhas de lembrete em memória, compartilhadas entre a tela de ajustes e
 * o sincronizador (que refaz a agenda quando elas mudam). Gravadas no aparelho.
 */
let current: ReminderSettings = DEFAULT_REMINDER_SETTINGS;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export async function initReminderStore(): Promise<void> {
  if (loaded) return;
  current = await loadReminderSettings();
  loaded = true;
  emit();
}

export function getReminderSettings(): ReminderSettings {
  return current;
}

export async function updateReminderSettings(next: ReminderSettings): Promise<void> {
  current = next;
  emit();
  await saveReminderSettings(next);
}

export async function resetReminderStore(): Promise<void> {
  current = DEFAULT_REMINDER_SETTINGS;
  emit();
  await removeReminderSettings();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReminderSettings(): ReminderSettings {
  return useSyncExternalStore(subscribe, getReminderSettings, getReminderSettings);
}

/** Logout, sessão expirada e conta apagada: sem agenda e sem escolhas para a próxima pessoa. */
export async function clearReminders(): Promise<void> {
  await Promise.all([cancelAllReminders(), resetReminderStore()]);
}
