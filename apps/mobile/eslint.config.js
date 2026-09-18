const base = require('@minhasaude/config/eslint-preset.cjs');
const expoConfig = require('eslint-config-expo/flat');

// eslint-config-expo/flat já registra o plugin/parser do @typescript-eslint
// (com regras ajustadas para React Native). O preset compartilhado também
// registra o mesmo plugin via tseslint.configs.recommended, e o flat config
// do ESLint 10 não permite registrar o mesmo plugin duas vezes — então só
// aproveitamos do preset compartilhado o que não colide: js recommended,
// prettier e o ajuste de no-unused-vars.
const baseWithoutTypescriptPluginRegistration = base.filter(
  (config) => !config.plugins || !('@typescript-eslint' in config.plugins),
);

module.exports = [
  ...expoConfig,
  ...baseWithoutTypescriptPluginRegistration,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ['.expo/**', 'dist/**', 'android/**', 'ios/**'],
  },
];
