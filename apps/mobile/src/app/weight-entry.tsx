import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ModalHeader } from '@/components/ui/modal-header';
import { WeightEntryForm } from '@/features/weight/weight-entry-form';

/** Registro rápido de peso, aberto pelo "+" ou pelo card da tela Hoje. */
export default function WeightEntryScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-6 py-6" keyboardShouldPersistTaps="handled">
          <ModalHeader title={t('quickAdd.weightTitle')} />
          <WeightEntryForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
