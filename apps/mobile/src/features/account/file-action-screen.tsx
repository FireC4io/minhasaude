import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { PrimaryButton } from '@/features/auth/primary-button';

export interface FileActionTexts {
  intro: string;
  /** Título da lista do que vai no arquivo. */
  listTitle: string;
  items: readonly string[];
  /** Aviso embaixo da lista (formato, cuidado com dado de saúde). */
  note: string;
  generate: string;
  generating: string;
  done: string;
  error: string;
}

interface FileActionScreenProps {
  texts: FileActionTexts;
  /** Gera o arquivo e abre o compartilhar do sistema. */
  run: () => Promise<void>;
}

/**
 * Tela de "gerar um arquivo meu": explica o que vai nele, gera ao tocar e
 * confirma (com anúncio para o leitor de tela) ou explica a falha. Usada na
 * exportação dos dados e no relatório de progresso.
 */
export function FileActionScreen({ texts, run }: Readonly<FileActionScreenProps>) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  useAnnounce(done);

  async function handlePress() {
    setError(null);
    setDone(null);
    setIsRunning(true);
    try {
      await run();
      setDone(texts.done);
    } catch {
      setError(texts.error);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">{texts.intro}</AppText>

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          {texts.listTitle}
        </AppText>
        {texts.items.map((item) => (
          <AppText key={item} className="text-grafite">
            • {item}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        {texts.note}
      </AppText>

      {done ? (
        <AppText variant="bodyStrong" className="text-grafite">
          ✓ {done}
        </AppText>
      ) : null}
      <FormError message={error} />

      <PrimaryButton
        label={isRunning ? texts.generating : texts.generate}
        onPress={() => void handlePress()}
        isLoading={isRunning}
      />
    </ScrollView>
  );
}
