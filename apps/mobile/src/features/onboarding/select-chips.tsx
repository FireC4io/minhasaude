import { Pressable, Text, View } from 'react-native';

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
      <Text className="text-sm font-medium text-grafite">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              className={
                selected
                  ? 'rounded-full bg-mamao px-4 py-2'
                  : 'rounded-full border border-grafite px-4 py-2'
              }>
              <Text className={selected ? 'text-areia' : 'text-grafite'}>{optionLabels[option]}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-sm text-jabuticaba">{error}</Text> : null}
    </View>
  );
}
