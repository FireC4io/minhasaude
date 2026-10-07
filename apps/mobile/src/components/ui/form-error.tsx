

import { useAnnounce } from '@/features/accessibility/use-announce';
import { AppText } from '@/components/ui/app-text';

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
    <AppText variant="caption"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="text-jabuticaba">
      {message}
    </AppText>
  );
}
