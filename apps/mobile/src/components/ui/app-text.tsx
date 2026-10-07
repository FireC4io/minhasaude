import { Text, type TextProps } from 'react-native';

/**
 * Escala tipográfica do app (F4-05). Toda tela usa uma destas variantes em vez
 * de `text-sm`/`font-semibold` soltos. A cor fica com quem chama — duas
 * classes de cor no mesmo elemento não têm ordem garantida no NativeWind.
 *
 * Nunca acrescentar `font-semibold`/`font-bold` por fora: no Android isso
 * troca a fonte customizada pela do sistema. Peso diferente = variante nova.
 */
export const TEXT_VARIANTS = {
  title: 'font-display text-3xl',
  subtitle: 'font-display text-2xl',
  heading: 'font-body-semibold text-lg',
  body: 'font-body text-base',
  bodyStrong: 'font-body-semibold text-base',
  label: 'font-body-medium text-sm',
  caption: 'font-body text-sm',
  number: 'font-mono text-base',
  numberLarge: 'font-mono text-2xl',
} as const;

export type TextVariant = keyof typeof TEXT_VARIANTS;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  className?: string;
}

export function AppText({ variant = 'body', className, ...textProps }: AppTextProps) {
  return (
    <Text
      className={className ? `${TEXT_VARIANTS[variant]} ${className}` : TEXT_VARIANTS[variant]}
      {...textProps}
    />
  );
}
