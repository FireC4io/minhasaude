import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Verdadeiro quando alguma requisição passa de `thresholdMs`. A API no plano
 * gratuito dorme e leva de 30 a 60 s para acordar (F4-18): sem aviso, isso
 * parece app travado.
 */
export function useSlowNetwork(thresholdMs = 6000): boolean {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!busy) return undefined;
    const timer = setTimeout(() => setSlow(true), thresholdMs);
    // Ao terminar (ou mudar o limite), o aviso some e o relógio recomeça.
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [busy, thresholdMs]);

  return busy && slow;
}
