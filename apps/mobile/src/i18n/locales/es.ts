import type { Translations } from './pt-BR';

export const es: Translations = {
  common: {
    tryAgain: 'Intentar de nuevo',
    close: 'Cerrar',
    previewTitle: 'Vista previa — datos de ejemplo',
    connecting: 'Conectando con el servidor…',
    connectingHint: 'La primera vez del día puede tardar hasta un minuto. Lo que ya estaba en pantalla sigue aquí.',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },
  tabs: { today: 'Hoy', progress: 'Progreso', exams: 'Análisis', profile: 'Perfil' },
  goalUnavailable: {
    title: 'No se pudo cargar',
    body: 'No pudimos obtener tu meta ahora. Tus datos siguen guardados. Intenta de nuevo cuando vuelva internet.',
  },
  units: {
    kcal: { one: 'kilocaloría', other: 'kilocalorías' },
    gram: { one: 'gramo', other: 'gramos' },
    kilo: { one: 'kilo', other: 'kilos' },
  },
  language: {
    label: 'Idioma',
    system: 'Igual que el teléfono',
    hint: 'Los nombres de los alimentos siguen en portugués: vienen de la tabla brasileña TACO.',
  },
};
