import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MAX_FILE_BYTES, type PickResult, type PickedFile } from '../pick-exam-file';

/** O arquivo escolhido (câmera, galeria ou PDF) e o motivo quando não deu. */
export function useExamFile() {
  const { t } = useTranslation();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(picker: () => Promise<PickResult>) {
    setError(null);
    try {
      const result = await picker();
      if (result.status === 'denied') {
        setError(t('exams.upload.noCamera'));
      } else if (result.status === 'picked') {
        if (result.file.sizeBytes !== null && result.file.sizeBytes > MAX_FILE_BYTES) {
          setError(t('exams.upload.tooBig'));
          return;
        }
        setFile(result.file);
      }
    } catch {
      setError(t('exams.upload.openError'));
    }
  }

  return { file, clearFile: () => setFile(null), choose, error, setError };
}
