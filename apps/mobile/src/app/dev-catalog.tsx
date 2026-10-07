import { SafeAreaView } from 'react-native-safe-area-context';

import { ComponentCatalog } from '@/features/dev-catalog/component-catalog';

/**
 * Catálogo de componentes (F4-08), só em desenvolvimento — o `_layout.tsx`
 * raiz protege a rota com `__DEV__`. Abrir pelo link
 * `exp://127.0.0.1:8081/--/dev-catalog`.
 */
export default function DevCatalogScreen() {
  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-areia">
      <ComponentCatalog />
    </SafeAreaView>
  );
}
