import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormScreenProps {
  children: ReactNode;
  /** Centraliza o conteúdo na vertical quando sobra espaço (login, cadastro). */
  centered?: boolean;
}

/**
 * Tela com formulário: o teclado nunca esconde o botão (F4-14, achado #3).
 * O conteúdo rola, e tocar fora de um campo não descarta o toque num botão.
 */
export function FormScreen({ children, centered = false }: FormScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName={`grow gap-6 px-6 py-8 ${centered ? 'justify-center' : ''}`}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
