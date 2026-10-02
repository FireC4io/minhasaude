import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Anuncia `message` no leitor de tela sempre que ela muda para um valor novo.
 *
 * Só no iOS: no Android quem anuncia é o `accessibilityLiveRegion` do próprio
 * elemento, e chamar os dois faria o TalkBack falar a mensagem duas vezes. O
 * VoiceOver ignora `accessibilityLiveRegion` e não lê `role="alert"` sozinho.
 */
export function useAnnounce(message: string | null | undefined): void {
  useEffect(() => {
    if (message && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);
}
