import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MacroDisplayMode } from './progress-math';

const STORAGE_KEY = 'gota-vital:macro-mode';
const MODES: readonly MacroDisplayMode[] = ['remaining', 'consumed', 'percent'];

/** O app lembra como a pessoa prefere ver os macros (F4-30). */
export async function loadMacroMode(): Promise<MacroDisplayMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return MODES.includes(stored as MacroDisplayMode) ? (stored as MacroDisplayMode) : 'remaining';
  } catch {
    return 'remaining';
  }
}

export async function saveMacroMode(mode: MacroDisplayMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Conveniência local; sem armazenamento a escolha vale até fechar o app.
  }
}
