// Módulos nativos sem implementação no Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Testes escrevem os textos em português: o i18n começa sempre em pt-BR,
// qualquer que seja o idioma da máquina.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'pt-BR' }] }));
require('./src/i18n');
