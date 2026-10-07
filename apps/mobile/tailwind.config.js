/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/features/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        areia: 'var(--color-areia)',
        superficie: 'var(--color-superficie)',
        linha: 'var(--color-linha)',
        grafite: 'var(--color-grafite)',
        'grafite-suave': 'var(--color-grafite-suave)',
        mamao: 'var(--color-mamao)',
        'mamao-forte': 'var(--color-mamao-forte)',
        couve: 'var(--color-couve)',
        jabuticaba: 'var(--color-jabuticaba)',
        maracuja: 'var(--color-maracuja)',
        'maracuja-forte': 'var(--color-maracuja-forte)',
      },
      // Uma família por peso (ver src/constants/typography.ts). O primeiro nome
      // é o registrado pelo expo-font; os seguintes são o fallback.
      fontFamily: {
        display: ['Fredoka_600SemiBold', 'system-ui', 'sans-serif'],
        body: ['WorkSans_400Regular', 'system-ui', 'sans-serif'],
        'body-medium': ['WorkSans_500Medium', 'system-ui', 'sans-serif'],
        'body-semibold': ['WorkSans_600SemiBold', 'system-ui', 'sans-serif'],
        mono: ['JetBrainsMono_500Medium', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
