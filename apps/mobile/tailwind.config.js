/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/features/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        areia: 'var(--color-areia)',
        superficie: 'var(--color-superficie)',
        grafite: 'var(--color-grafite)',
        mamao: 'var(--color-mamao)',
        couve: 'var(--color-couve)',
        jabuticaba: 'var(--color-jabuticaba)',
        maracuja: 'var(--color-maracuja)',
      },
    },
  },
  plugins: [],
};
