import { Pressable, View } from 'react-native';


interface FloatingAddButtonProps {
  onPress: () => void;
}

/** Botão "+" de registro rápido, sempre ao alcance do polegar (F4-20). */
export function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Registrar"
      accessibilityHint="Alimento, água ou peso"
      style={{ width: 64, height: 64 }}
      className="absolute bottom-6 right-6 items-center justify-center rounded-full bg-mamao-forte shadow-lg active:opacity-80">
      {/* Cruz desenhada: o "+" da fonte saía fino demais para ser visto de longe. */}
      <View className="absolute h-1 w-7 rounded-full bg-areia" />
      <View className="absolute h-7 w-1 rounded-full bg-areia" />
    </Pressable>
  );
}
