import { useTranslation } from 'react-i18next';

import AppTabs from '@/components/app-tabs';
import { useOfflineSync } from '@/features/offline-queue/offline-queue';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';

export default function AppLayout() {
  const { i18n } = useTranslation();
  useReminderSync();
  useOfflineSync();
  // Trocar o idioma recria as abas. Textos montados fora do componente
  // (`i18n.t` em progress-math, rótulos de `translatedLabels`) ficavam no
  // idioma antigo: o React Compiler guarda o resultado enquanto os números não
  // mudam. A troca é feita em Preferências, por cima das abas, então recriar
  // não tira a pessoa de onde está.
  return <AppTabs key={i18n.language} />;
}
