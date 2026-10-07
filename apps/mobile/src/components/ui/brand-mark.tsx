import { useColorScheme } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';

import { GotaVitalColors } from '@/constants/gota-vital-colors';

/** Símbolo Gota Vital (gota + traço de batimento), mesma geometria do ícone do app. */
export function BrandMark({ size = 72 }: { size?: number }) {
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityElementsHidden
      importantForAccessibility="no">
      <Path
        d="M50 8 C 66 30 82 52 82 68 C 82 86 68 96 50 96 C 32 96 18 86 18 68 C 18 52 34 30 50 8 Z"
        fill={colors.mamao}
      />
      <Polyline
        points="30,64 42,64 47,50 54,80 59,64 70,64"
        fill="none"
        stroke={colors.areia}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
