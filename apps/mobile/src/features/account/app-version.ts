/**
 * Versão mostrada em "Sobre". O número do build (versionCode no Android) muda a
 * cada envio à loja: é ele que diz qual APK/AAB um testador está usando.
 */
export function formatAppVersion(version: string | undefined, build: string | null): string {
  if (!version) return '—';
  return build ? `${version} (${build})` : version;
}
