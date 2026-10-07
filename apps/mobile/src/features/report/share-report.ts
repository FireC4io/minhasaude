import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { reportFileName } from './report-file-name';

/**
 * Imprime o HTML em PDF no próprio aparelho (sem servidor) e abre a folha de
 * compartilhar. O PDF fica só no cache, que o sistema limpa.
 */
export async function shareReport(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  const destination = new File(Paths.cache, reportFileName());
  // O expo-print gera um nome aleatório; renomear deixa claro o que é ao salvar.
  await new File(uri).move(destination, { overwrite: true });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste aparelho.');
  }
  await Sharing.shareAsync(destination.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Salvar relatório do Gota Vital',
    UTI: 'com.adobe.pdf',
  });
}
