import { useTranslation } from 'react-i18next';

import AppTabs from '@/components/app-tabs';

export default function AppLayout() {
  const { i18n } = useTranslation();
  // Trocar o idioma recria as abas. Textos montados fora do componente
  // (`i18n.t` em progress-math, rótulos de `translatedLabels`) ficavam no
  // idioma antigo: o React Compiler guarda o resultado enquanto os números não
  // mudam. A troca é feita em Preferências, por cima das abas, então recriar
  // não tira a pessoa de onde está.
  return <AppTabs key={i18n.language} />;
}
