import { Pressable, View } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { AppText } from '@/components/ui/app-text';

interface SelectChipsProps<TValue extends string> {
  label: string;
  options: readonly TValue[];
  optionLabels: Record<TValue, string>;
  value: TValue | null;
  onChange: (value: TValue) => void;
  error?: string;
}

export function SelectChips<TValue extends string>({
  label,
  options,
  optionLabels,
  value,
  onChange,
  error,
}: SelectChipsProps<TValue>) {
  return (
    <View className="gap-2">
      <AppText variant="label" className="text-grafite">{label}</AppText>

      {/* `radiogroup` sem `accessible`: cada chip continua focável um a um.
          Sem `accessibilityLabel`: no Android o grupo rotulado vira uma parada
          própria e o TalkBack lia o rótulo duas vezes (o texto acima basta). */}
      <View
        testID="select-chips-group"
        accessibilityRole="radiogroup"
        className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityLabel={optionLabels[option]}
              // `selected` é o que o iOS lê; `checked` é o que o Android lê.
              accessibilityState={{ selected, checked: selected }}
              style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
              className={
                selected
                  ? 'rounded-full bg-mamao-forte px-4 py-2'
                  : 'rounded-full border border-grafite px-4 py-2'
              }>
              <AppText className={selected ? 'text-areia' : 'text-grafite'}>
                {/* O ✓ marca a escolha sem depender da cor (F4-10). */}
                {selected ? '✓ ' : ''}
                {optionLabels[option]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <AppText variant="caption"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-jabuticaba">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
