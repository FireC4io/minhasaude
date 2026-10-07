import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

export default function AppTabs() {
  const { t } = useTranslation();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>{t('tabs.today')}</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton>{t('tabs.progress')}</TabButton>
          </TabTrigger>
          <TabTrigger name="exams" href="/exams" asChild>
            <TabButton>{t('tabs.exams')}</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>{t('tabs.profile')}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      // Objeto, não função — ver o comentário em `TextButton`.
      style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
      className={`rounded-2xl px-4 active:opacity-70 ${isFocused ? 'bg-areia' : ''}`}>
      <AppText
        variant="label"
        className={isFocused ? 'text-mamao-forte' : 'text-grafite-suave'}>
        {children}
      </AppText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    // `box-none`: o container ocupa a largura toda mas só a pílula central é
    // visível. Sem isso, a faixa transparente de 76px vira um escudo sobre o
    // topo de todas as telas na web e engole cliques — o botão "Sair" e as
    // setas de navegação entre dias do diário ficavam inalcançáveis.
    <View
      {...props}
      pointerEvents="box-none"
      className="absolute w-full flex-row items-center justify-center p-4">
      <View className="max-w-[800px] grow flex-row items-center gap-2 rounded-[32px] bg-superficie px-8 py-2">
        <AppText variant="bodyStrong" className="mr-auto text-grafite">
          Gota Vital
        </AppText>
        {props.children}
      </View>
    </View>
  );
}
