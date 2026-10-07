import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

export interface RadioOption<TValue extends string> {
  value: TValue;
  label: string;
  /** Exemplo concreto da opção — é o que tira a dúvida de quem escolhe. */
  description?: string;
}

interface RadioListProps<TValue extends string> {
  label: string;
  options: readonly RadioOption<TValue>[];
  value: TValue | null;
  onChange: (value: TValue) => void;
  error?: string;
}

/**
 * Escolha única em lista vertical, para opções que precisam de explicação
 * (ex.: nível de atividade). Para opções curtas, `SelectChips`.
 */
export function RadioList<TValue extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: RadioListProps<TValue>) {
  return (
    <View className="gap-2">
      <AppText variant="label" className="text-grafite">
        {label}
      </AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={
                option.description ? `${option.label}. ${option.description}` : option.label
              }
              accessibilityState={{ selected, checked: selected }}
              style={{ minHeight: MIN_TOUCH_TARGET }}
              className={`flex-row items-center gap-3 rounded-2xl border-2 px-4 py-3 active:opacity-80 ${
                selected ? 'border-mamao-forte bg-superficie' : 'border-linha bg-superficie'
              }`}>
              <View className="flex-1 gap-0.5">
                <AppText variant="bodyStrong" className="text-grafite">
                  {option.label}
                </AppText>
                {option.description ? (
                  <AppText variant="caption" className="text-grafite-suave">
                    {option.description}
                  </AppText>
                ) : null}
              </View>
              {selected ? (
                <AppText variant="bodyStrong" className="text-mamao-forte">
                  ✓
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText
          variant="caption"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-jabuticaba">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
