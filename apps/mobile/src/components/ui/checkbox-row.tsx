import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Caixa de seleção com o texto inteiro tocável — alvo grande, nome completo. */
export function CheckboxRow({ label, checked, onChange }: CheckboxRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={{ minHeight: MIN_TOUCH_TARGET }}
      className="flex-row items-center gap-3 py-2 active:opacity-70">
      <View
        className={`h-7 w-7 items-center justify-center rounded-md border-2 ${
          checked ? 'border-mamao-forte bg-mamao-forte' : 'border-grafite bg-superficie'
        }`}>
        {checked ? (
          <AppText variant="bodyStrong" className="text-areia">
            ✓
          </AppText>
        ) : null}
      </View>
      <AppText className="flex-1 text-grafite">{label}</AppText>
    </Pressable>
  );
}
