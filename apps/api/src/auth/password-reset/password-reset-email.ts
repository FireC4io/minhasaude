import type { MailMessage } from '../../mail/mailer';

export const EMAIL_LANGUAGES = ['pt-BR', 'en', 'es'] as const;
export type EmailLanguage = (typeof EMAIL_LANGUAGES)[number];

interface EmailCopy {
  subject: string;
  intro: string;
  validity: (minutes: number) => string;
  notYou: string;
}

const COPY: Record<EmailLanguage, EmailCopy> = {
  'pt-BR': {
    subject: 'Seu código para criar uma senha nova',
    intro: 'Use este código no app Gota Vital para criar uma senha nova:',
    validity: (minutes) => `O código vale por ${minutes} minutos e só pode ser usado uma vez.`,
    notYou: 'Se não foi você que pediu, pode ignorar este e-mail. Sua senha continua a mesma.',
  },
  en: {
    subject: 'Your code to create a new password',
    intro: 'Use this code in the Gota Vital app to create a new password:',
    validity: (minutes) => `The code is valid for ${minutes} minutes and can only be used once.`,
    notYou: "If you didn't ask for this, you can ignore this email. Your password stays the same.",
  },
  es: {
    subject: 'Tu código para crear una contraseña nueva',
    intro: 'Usa este código en la app Gota Vital para crear una contraseña nueva:',
    validity: (minutes) => `El código vale por ${minutes} minutos y solo se puede usar una vez.`,
    notYou: 'Si no fuiste tú quien lo pidió, puedes ignorar este correo. Tu contraseña sigue igual.',
  },
};

/** E-mail com o código. Texto simples e letra grande: o público inclui quem enxerga pouco. */
export function buildPasswordResetEmail(
  to: string,
  code: string,
  validityMinutes: number,
  language: EmailLanguage = 'pt-BR',
): MailMessage {
  const copy = COPY[language];
  const validity = copy.validity(validityMinutes);
  // O código só tem dígitos (validado na geração) e o resto é texto fixo: nada da pessoa entra no HTML.
  const html = [
    `<div style="font-family:Arial,sans-serif;font-size:18px;line-height:1.5;color:#2b2b2b">`,
    `<p>${copy.intro}</p>`,
    `<p style="font-size:36px;font-weight:bold;letter-spacing:8px">${code}</p>`,
    `<p>${validity}</p>`,
    `<p>${copy.notYou}</p>`,
    `<p>Gota Vital</p>`,
    `</div>`,
  ].join('');

  return {
    to,
    subject: copy.subject,
    text: `${copy.intro}\n\n${code}\n\n${validity}\n\n${copy.notYou}\n\nGota Vital`,
    html,
  };
}
