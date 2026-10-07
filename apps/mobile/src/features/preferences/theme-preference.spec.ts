import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

import { applyThemePreference, loadThemePreference, saveThemePreference } from './theme-preference';

jest.mock('nativewind', () => ({ colorScheme: { set: jest.fn() } }));

describe('preferência de tema', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('segue o aparelho quando nada foi escolhido', async () => {
    expect(await loadThemePreference()).toBe('system');
  });

  it('guarda e devolve a escolha', async () => {
    await saveThemePreference('dark');

    expect(await loadThemePreference()).toBe('dark');
  });

  it('ignora valor estranho guardado', async () => {
    await AsyncStorage.setItem('gota-vital:theme', 'roxo');

    expect(await loadThemePreference()).toBe('system');
  });

  it('aplica no NativeWind', () => {
    applyThemePreference('light');

    expect(colorScheme.set).toHaveBeenCalledWith('light');
  });
});
