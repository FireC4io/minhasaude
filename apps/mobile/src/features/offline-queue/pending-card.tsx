import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';
import { formatIsoDateLabel } from '@/features/diary/date-utils';
import { formatKg } from '@/features/weight/format-weight';

import { pendingStore, useFlushPending, usePendingState } from './offline-queue';
import type { PendingItem } from './pending-item';

function useItemName(): (item: PendingItem) => string {
  const { t } = useTranslation();
  return (item) =>
    item.kind === 'diary'
      ? t('offline.diaryItem', { food: item.food.name, date: formatIsoDateLabel(item.data.date) })
      : t('offline.weightItem', { weight: formatKg(item.data.weightKg) });
}

/**
 * Tela Hoje: o que foi anotado sem internet e ainda não chegou ao servidor, e
 * o que o servidor recusou. Some quando não há nada esperando.
 */
export function PendingCard() {
  const { t } = useTranslation();
  const { items, failed } = usePendingState();
  const flush = useFlushPending();
  const nameOf = useItemName();
  const [sending, setSending] = useState(false);

  if (items.length === 0 && failed.length === 0) return null;

  async function sendNow() {
    setSending(true);
    try {
      await flush();
    } finally {
      setSending(false);
    }
  }

  return (
    <View className="gap-3">
      {items.length > 0 ? (
        <View className="gap-2 rounded-2xl border border-linha bg-superficie p-4">
          <AppText variant="bodyStrong" accessibilityRole="header" className="text-grafite">
            {t('offline.cardTitle', { count: items.length })}
          </AppText>
          <AppText variant="caption" className="text-grafite">
            {t('offline.cardBody')}
          </AppText>
          {items.map((item) => (
            <View key={item.clientId} className="flex-row items-center justify-between gap-2">
              <AppText className="flex-1 text-grafite">{nameOf(item)}</AppText>
              <TextButton
                label={t('offline.discard')}
                accessibilityLabel={t('offline.discardSpoken', { name: nameOf(item) })}
                onPress={() => void pendingStore.remove(item.clientId)}
                textVariant="caption"
                textClassName="text-jabuticaba"
              />
            </View>
          ))}
          <TextButton
            label={sending ? t('offline.sending') : t('offline.sendNow')}
            onPress={() => void sendNow()}
            busy={sending}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
            className="self-start"
          />
        </View>
      ) : null}

      {failed.map((item) => (
        <View
          key={item.clientId}
          accessibilityLiveRegion="polite"
          className="gap-2 rounded-2xl border border-linha bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            {t('offline.failedTitle')}
          </AppText>
          <AppText className="text-grafite">{t('offline.failedBody', { name: item.label })}</AppText>
          <TextButton
            label={t('offline.failedDismiss')}
            onPress={() => void pendingStore.dismissFailed(item.clientId)}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
            className="self-start"
          />
        </View>
      ))}
    </View>
  );
}
