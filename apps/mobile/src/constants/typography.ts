import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from '@expo-google-fonts/work-sans';

/**
 * Fontes da identidade Gota Vital, carregadas no `_layout.tsx` raiz. A chave é
 * o nome da família que o `tailwind.config.js` usa em `fontFamily` — cada peso
 * é uma família própria, porque no Android `fontWeight` com fonte customizada
 * cai para a fonte do sistema.
 *
 * - Fredoka: títulos, tom acolhedor
 * - Work Sans: texto corrido
 * - JetBrains Mono: números (monoespaçada, então as colunas alinham)
 */
export const APP_FONTS = {
  Fredoka_600SemiBold,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  JetBrainsMono_500Medium,
} as const;
