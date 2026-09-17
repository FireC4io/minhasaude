// Shared ESLint flat-config preset. Each app/package extends this array in its own eslint.config.js:
//   const base = require('@minhasaude/config/eslint-preset.cjs');
//   module.exports = [...base, { /* app-specific overrides */ }];
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', '.turbo/**', 'coverage/**'],
  },
];
