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
        'grafite-suave': 'var(--color-grafite-suave)',
        mamao: 'var(--color-mamao)',
        'mamao-forte': 'var(--color-mamao-forte)',
        couve: 'var(--color-couve)',
        jabuticaba: 'var(--color-jabuticaba)',
        maracuja: 'var(--color-maracuja)',
        'maracuja-forte': 'var(--color-maracuja-forte)',
      },
    },
  },
  plugins: [],
};
