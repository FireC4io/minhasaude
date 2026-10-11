import appJson from '../../app.json';

/**
 * Configurações de segurança do app nativo que um ajuste distraído no
 * app.json desfaria sem nenhum outro teste perceber.
 */
describe('app.json', () => {
  const expo = appJson.expo as typeof appJson.expo & {
    android: {
      allowBackup?: boolean;
      usesCleartextTraffic?: boolean;
      permissions?: string[];
      blockedPermissions?: string[];
    };
  };

  it('usa o identificador definitivo nas duas lojas', () => {
    expect(expo.android.package).toBe('br.com.gotavital');
    expect(expo.ios.bundleIdentifier).toBe('br.com.gotavital');
  });

  it('não deixa o backup do Android copiar os dados do app', () => {
    // A cópia local do diário e do peso (dado de saúde) iria para o backup na
    // nuvem do Google; o padrão do Expo é permitir.
    expect(expo.android.allowBackup).toBe(false);
  });

  it('não libera tráfego sem HTTPS', () => {
    expect(expo.android.usesCleartextTraffic).toBeUndefined();
  });

  it('não pede microfone nem serviço em segundo plano enquanto a voz está em prévia', () => {
    // Pedir só o necessário: a voz está desligada no build de produção, e
    // serviço em segundo plano exige declaração e vídeo na Play.
    expect(expo.android.permissions ?? []).not.toContain('android.permission.RECORD_AUDIO');
    expect(expo.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        'android.permission.RECORD_AUDIO',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        // Desenhar por cima de outros apps: só o menu de desenvolvimento usa.
        'android.permission.SYSTEM_ALERT_WINDOW',
      ]),
    );
  });

  it('não pede câmera, arquivos nem ajuste de áudio enquanto exames e voz estão em prévia', () => {
    // Análise do APK no MobSF (2026-10-11). A câmera volta com os exames
    // (Fase 6); arquivos não voltam: a galeria do Android e o seletor de
    // documentos não precisam de permissão.
    expect(expo.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.MODIFY_AUDIO_SETTINGS',
      ]),
    );
  });
});
