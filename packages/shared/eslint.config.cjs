const base = require('@minhasaude/config/eslint-preset.cjs');

module.exports = [
  ...base,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
];
