import { MICRONUTRIENT_KEYS, MICRONUTRIENTS, type MicronutrientKey } from '@minhasaude/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

import { formatMicro, spokenMicro } from './micros-format';

export interface MicroRow {
  amount: number | null;
  /** Ex.: "3 de 5 alimentos têm esse dado" — total parcial do dia. */
  note?: string | null;
}

interface MicrosPanelProps {
  title: string;
  rows: Record<MicronutrientKey, MicroRow>;
  /** Fecha por padrão: a tela principal fica limpa para quem quer só as calorias. */
  initiallyOpen?: boolean;
}

/**
 * Lista de micronutrientes recolhível. Só quantidades, sem comparar com metas
 * ou limites (informativo, RDC 657/2022). "sem dado" nunca vira zero.
 */
export function MicrosPanel({ title, rows, initiallyOpen = false }: MicrosPanelProps) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View className="gap-2 rounded-2xl bg-superficie p-4">
      <TextButton
        label={open ? `Esconder ${title.toLowerCase()}` : `Ver ${title.toLowerCase()}`}
        hint={open ? undefined : 'Mostra fibras, sódio, minerais e vitaminas'}
        onPress={() => setOpen(!open)}
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
      />
      {open ? (
        <View className="gap-2">
          {MICRONUTRIENT_KEYS.map((key) => {
            const row = rows[key];
            const spoken = [spokenMicro(key, row.amount), row.note].filter(Boolean).join('. ');
            return (
              <View key={key} accessible accessibilityLabel={spoken} className="gap-0.5">
                <View className="flex-row justify-between gap-4">
                  <AppText className="text-grafite">{MICRONUTRIENTS[key].label}</AppText>
                  <AppText variant="bodyStrong" className="text-grafite">
                    {formatMicro(key, row.amount)}
                  </AppText>
                </View>
                {row.note ? (
                  <AppText variant="caption" className="text-grafite-suave">
                    {row.note}
                  </AppText>
                ) : null}
              </View>
            );
          })}
          <AppText variant="caption" className="text-grafite-suave">
            Valores da Tabela TACO (Unicamp) ou do Open Food Facts. “Sem dado” quer dizer que a
            fonte não mediu esse nutriente.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
