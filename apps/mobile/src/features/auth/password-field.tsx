import { useState, type Ref } from 'react';
import { View, type TextInput, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TextButton } from '@/components/ui/text-button';

import { AuthTextField } from './auth-text-field';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  ref?: Ref<TextInput>;
}

/**
 * Senha com "Mostrar": quem digita com dificuldade ou enxerga pouco erra a
 * senha sem ver o que digitou, e não sabe onde errou.
 */
export function PasswordField({ label, ref, ...inputProps }: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-1">
      <AuthTextField ref={ref} label={label} secureTextEntry={!visible} {...inputProps} />
      <TextButton
        label={visible ? t('common.hidePassword') : t('common.showPassword')}
        onPress={() => setVisible(!visible)}
        textVariant="label"
        textClassName="text-mamao-forte"
        className="self-start"
      />
    </View>
  );
}
