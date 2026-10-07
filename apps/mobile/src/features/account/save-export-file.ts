import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Grava o JSON no cache do app e abre a folha de compartilhar do sistema — de
 * lá a pessoa salva nos arquivos, manda por e-mail etc. O arquivo fica só no
 * cache, que o sistema limpa; o app não guarda cópia.
 */
export async function saveExportFile(fileName: string, content: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.write(content);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste aparelho.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Salvar meus dados do Gota Vital',
    UTI: 'public.json',
  });
}
