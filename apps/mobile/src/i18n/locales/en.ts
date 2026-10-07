import type { Translations } from './pt-BR';

export const en: Translations = {
  common: {
    tryAgain: 'Try again',
    close: 'Close',
    previewTitle: 'Preview — sample data',
    connecting: 'Connecting to the server…',
    connectingHint: 'The first time each day it can take up to a minute. What was already on screen stays here.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  tabs: { today: 'Today', progress: 'Progress', exams: 'Tests', profile: 'Profile' },
  goalUnavailable: {
    title: "Couldn't load",
    body: "We couldn't get your goal right now. Your data is still saved. Try again when your internet is back.",
  },
  units: {
    kcal: { one: 'kilocalorie', other: 'kilocalories' },
    gram: { one: 'gram', other: 'grams' },
    kilo: { one: 'kilo', other: 'kilos' },
  },
  language: {
    label: 'Language',
    system: 'Same as the phone',
    hint: 'Food names stay in Portuguese: they come from the Brazilian TACO table.',
  },
};
