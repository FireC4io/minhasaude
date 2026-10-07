import { useEffect } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';
import { useAnnounce } from '@/features/accessibility/use-announce';

interface UndoBarProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** Tempo na tela. Generoso: quem lê devagar ou usa leitor de tela precisa de tempo. */
  durationMs?: number;
}

/** Aviso com "Desfazer" depois de uma remoção (F4-16) — nada some sem volta. */
export function UndoBar({ message, onUndo, onDismiss, durationMs = 10_000 }: UndoBarProps) {
  useAnnounce(`${message}. Para desfazer, toque em Desfazer.`);

  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  return (
    <View
      accessibilityLiveRegion="polite"
      className="absolute bottom-24 left-4 right-4 flex-row items-center gap-3 rounded-2xl bg-grafite px-4 py-2">
      <AppText className="flex-1 text-areia">{message}</AppText>
      <TextButton
        label="Desfazer"
        onPress={onUndo}
        textVariant="bodyStrong"
        textClassName="text-areia underline"
      />
    </View>
  );
}
