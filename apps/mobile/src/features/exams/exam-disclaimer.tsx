import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';

/** Aviso fixo das telas de resultado (RDC 657/2022): o app informa, não diagnostica. */
export function ExamDisclaimer() {
  return (
    <View className="rounded-2xl border border-linha p-4">
      <AppText variant="caption" className="text-grafite">
        Informativo. O app compara cada valor com a faixa de referência escrita no próprio laudo e
        não faz diagnóstico. Converse com seu médico sobre os seus resultados.
      </AppText>
    </View>
  );
}
