import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SelectChips } from '@/features/onboarding/select-chips';
import {
  THEME_PREFERENCES,
  THEME_PREFERENCE_LABELS,
  applyThemePreference,
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/features/preferences/theme-preference';
import {
  OFFLINE_COPY_DAYS,
  OFFLINE_COPY_LABELS,
  loadOfflineCopyDays,
  saveOfflineCopyDays,
  type OfflineCopyDays,
} from '@/features/preferences/offline-copy-preference';

export default function PreferencesScreen() {
  const [theme, setTheme] = useState<ThemePreference | null>(null);
  const [offlineDays, setOfflineDays] = useState<OfflineCopyDays | null>(null);

  useEffect(() => {
    void loadThemePreference().then(setTheme);
    void loadOfflineCopyDays().then(setOfflineDays);
  }, []);

  function chooseOfflineDays(days: OfflineCopyDays) {
    setOfflineDays(days);
    void saveOfflineCopyDays(days);
  }

  function chooseTheme(preference: ThemePreference) {
    setTheme(preference);
    applyThemePreference(preference);
    void saveThemePreference(preference);
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <SelectChips
        label="Tema"
        options={THEME_PREFERENCES}
        optionLabels={THEME_PREFERENCE_LABELS}
        value={theme}
        onChange={chooseTheme}
      />
      <AppText variant="caption" className="text-grafite-suave">
        O tema escuro cansa menos a vista à noite. “Igual ao aparelho” acompanha o que estiver
        configurado no seu celular. Na versão para navegador, vale sempre o tema do navegador.
      </AppText>
      <AppText variant="caption" className="text-grafite-suave">
        Para letras maiores, aumente o tamanho da fonte nas configurações do celular: o app
        acompanha.
      </AppText>

      <SelectChips
        label="Cópia dos dados no celular"
        options={OFFLINE_COPY_DAYS}
        optionLabels={OFFLINE_COPY_LABELS}
        value={offlineDays}
        onChange={chooseOfflineDays}
      />
      <AppText variant="caption" className="text-grafite-suave">
        O app guarda no celular uma cópia do que você já viu, para abrir mesmo sem internet. Se
        você ficar mais tempo que isso sem abrir o app, a cópia é apagada. Ela também é apagada
        quando você sai da conta. A nova escolha vale a partir da próxima vez que abrir o app.
      </AppText>
    </ScrollView>
  );
}
