import type { ParseKeys } from 'i18next';

export interface WelcomeFeature {
  id: string;
  titleKey: ParseKeys;
  textKey: ParseKeys;
}

/**
 * O que a tela de boas-vindas anuncia. Exames e voz estão em prévia: no app
 * publicado não existem, então não podem ser prometidos (a Play reprova, e
 * quem instala se sente enganado). No lugar entra a meta diária.
 */
export function welcomeFeatures(previewFeatures: boolean): WelcomeFeature[] {
  if (previewFeatures) {
    return [
      { id: 'food', titleKey: 'auth.welcome.foodTitle', textKey: 'auth.welcome.foodText' },
      { id: 'weight', titleKey: 'auth.welcome.weightTitle', textKey: 'auth.welcome.weightText' },
      { id: 'exams', titleKey: 'auth.welcome.examsTitle', textKey: 'auth.welcome.examsText' },
    ];
  }
  return [
    { id: 'food', titleKey: 'auth.welcome.foodTitle', textKey: 'auth.welcome.foodTextSearch' },
    { id: 'weight', titleKey: 'auth.welcome.weightTitle', textKey: 'auth.welcome.weightText' },
    { id: 'goal', titleKey: 'auth.welcome.goalTitle', textKey: 'auth.welcome.goalText' },
  ];
}
