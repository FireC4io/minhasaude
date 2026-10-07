import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { appLocale } from '@/i18n/format';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  kind: 'image' | 'pdf';
}

export type PickResult =
  { status: 'picked'; file: PickedFile } | { status: 'cancelled' } | { status: 'denied' };

/** Limite de tamanho do envio — fotos de celular cabem com folga. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const fromAsset = (asset: ImagePicker.ImagePickerAsset): PickedFile => ({
  uri: asset.uri,
  name: asset.fileName ?? 'foto-do-exame.jpg',
  mimeType: asset.mimeType ?? 'image/jpeg',
  sizeBytes: asset.fileSize ?? null,
  kind: 'image',
});

export async function takeExamPhoto(): Promise<PickResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  const asset = result.assets?.[0];
  return result.canceled || !asset
    ? { status: 'cancelled' }
    : { status: 'picked', file: fromAsset(asset) };
}

export async function pickExamImage(): Promise<PickResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  const asset = result.assets?.[0];
  return result.canceled || !asset
    ? { status: 'cancelled' }
    : { status: 'picked', file: fromAsset(asset) };
}

export async function pickExamPdf(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return { status: 'cancelled' };
  return {
    status: 'picked',
    file: {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
      sizeBytes: asset.size ?? null,
      kind: 'pdf',
    },
  };
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '';
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString(appLocale(), { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
