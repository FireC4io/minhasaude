import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { vars } from 'nativewind';

import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';
import type { GotaVitalScheme } from '@/constants/gota-vital-colors';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { SelectChips } from '@/features/onboarding/select-chips';

import { paletteCssVars } from './theme-vars';
import { AppText } from '@/components/ui/app-text';

const THEMES: readonly { scheme: GotaVitalScheme; title: string }[] = [
  { scheme: 'light', title: 'Tema claro' },
  { scheme: 'dark', title: 'Tema escuro' },
];

const SEX_OPTIONS = ['female', 'male'] as const;
const SEX_LABELS = { female: 'Feminino', male: 'Masculino' } as const;

// Catálogo é só para olhar: as ações não fazem nada.
const noop = () => undefined;

/**
 * Cada componente base em cada estado que dá para mostrar parado, nos dois
 * temas (F4-08). O estado "pressionado" é `active:opacity-*` e só aparece
 * tocando — por isso não tem exemplo próprio.
 *
 * Ao criar um componente base novo, adicione-o aqui.
 */
export function ComponentCatalog() {
  return (
    <ScrollView>
      {THEMES.map(({ scheme, title }) => (
        <View key={scheme} style={vars(paletteCssVars(scheme))} className="gap-6 bg-areia p-6">
          <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
            {title}
          </AppText>
          <ThemeSamples />
        </View>
      ))}
    </ScrollView>
  );
}

function ThemeSamples() {
  return (
    <>
      <Section title="PrimaryButton">
        <PrimaryButton label="Salvar" onPress={noop} />
        <PrimaryButton label="Salvar (desabilitado)" onPress={noop} disabled />
        <PrimaryButton label="Salvando" onPress={noop} isLoading />
      </Section>

      <Section title="TextButton">
        <TextButton
          label="+ Adicionar alimento"
          onPress={noop}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
        />
        <TextButton label="Desabilitado" onPress={noop} disabled textVariant="body" textClassName="text-mamao-forte" />
        <TextButton label="Copiando…" onPress={noop} busy textVariant="body" textClassName="text-mamao-forte" />
      </Section>

      <Section title="AuthTextField">
        <AuthTextField label="Vazio" placeholder="ex: arroz branco" />
        <AuthTextField label="Preenchido" value="maria@exemplo.com" />
        <AuthTextField label="Com erro" value="maria@" error="Informe um e-mail válido." />
      </Section>

      <Section title="SelectChips">
        <SelectChips
          label="Nenhum escolhido"
          options={SEX_OPTIONS}
          optionLabels={SEX_LABELS}
          value={null}
          onChange={noop}
        />
        <SelectChips
          label="Escolhido"
          options={SEX_OPTIONS}
          optionLabels={SEX_LABELS}
          value="female"
          onChange={noop}
        />
        <SelectChips
          label="Com erro"
          options={SEX_OPTIONS}
          optionLabels={SEX_LABELS}
          value={null}
          onChange={noop}
          error="Escolha uma opção."
        />
      </Section>

      <Section title="FormError">
        <FormError message="Não foi possível salvar. Tente de novo." />
      </Section>

      <Section title="LoadingIndicator">
        <LoadingIndicator label="Carregando o diário" />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="number" className="text-grafite">{title}</AppText>
      {children}
    </View>
  );
}
