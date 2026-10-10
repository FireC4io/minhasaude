import appJson from '../../app.json';

/**
 * Configurações de segurança do app nativo que um ajuste distraído no
 * app.json desfaria sem nenhum outro teste perceber.
 */
describe('app.json', () => {
  const expo = appJson.expo as typeof appJson.expo & {
    android: { allowBackup?: boolean; usesCleartextTraffic?: boolean };
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
});
