import { Text } from 'react-native';

import { useAnnounce } from '@/features/accessibility/use-announce';

interface FormErrorProps {
  message: string | null | undefined;
}

/**
 * Mensagem de erro anunciada pelo leitor de tela assim que aparece. Sem isso o
 * erro só existia como texto vermelho: quem não enxerga tocava em "Entrar" e
 * não sabia que nada tinha acontecido.
 */
export function FormError({ message }: FormErrorProps) {
  useAnnounce(message);

  if (!message) {
    return null;
  }

  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="text-sm text-jabuticaba">
      {message}
    </Text>
  );
}
