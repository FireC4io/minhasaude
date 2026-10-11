import { welcomeFeatures } from './welcome-features';

describe('welcomeFeatures', () => {
  it('no app publicado, só anuncia o que existe: nada de exames nem de voz', () => {
    const features = welcomeFeatures(false);

    expect(features.map((f) => f.titleKey)).toEqual([
      'auth.welcome.foodTitle',
      'auth.welcome.weightTitle',
      'auth.welcome.goalTitle',
    ]);
    expect(features[0]?.textKey).toBe('auth.welcome.foodTextSearch');
  });

  it('com as prévias ligadas, mostra também exames e voz', () => {
    const features = welcomeFeatures(true);

    expect(features.map((f) => f.titleKey)).toContain('auth.welcome.examsTitle');
    expect(features[0]?.textKey).toBe('auth.welcome.foodText');
  });
});
