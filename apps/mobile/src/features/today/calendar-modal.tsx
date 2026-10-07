import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { isoDateFromLocal, localDateFromIso, monthGrid, todayIsoDate } from '@/features/diary/date-utils';

import { useReduceMotion } from '@/features/accessibility/use-reduce-motion';

import { spokenDay } from './week-strip';
import { appLocale } from '@/i18n/format';

interface CalendarModalProps {
  visible: boolean;
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Primeiro dia do mês deslocado de `months` meses. */
const shiftMonth = (date: string, months: number): string => {
  const parsed = localDateFromIso(date);
  return isoDateFromLocal(new Date(parsed.getFullYear(), parsed.getMonth() + months, 1, 12));
};

/**
 * Calendário mensal em tela cheia, para pular para qualquer dia (F4-30).
 * Quem usa passa `key` com o dia exibido: ao reabrir, volta para o mês certo.
 */
export function CalendarModal({ visible, selectedDate, onSelect, onClose }: CalendarModalProps) {
  const [month, setMonth] = useState(selectedDate);
  const reduceMotion = useReduceMotion();
  const today = todayIsoDate();

  const rawMonthLabel = localDateFromIso(month).toLocaleDateString(appLocale(), {
    month: 'long',
    year: 'numeric',
  });
  // Só a primeira letra: a classe `capitalize` gerava "Outubro De 2026".
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  function choose(date: string) {
    onSelect(date);
    onClose();
  }

  return (
    <Modal visible={visible} animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 gap-4 bg-areia px-6 py-4">
        <View className="flex-row items-center justify-between">
          <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
            Escolher dia
          </AppText>
          <TextButton label="Fechar" onPress={onClose} textClassName="text-mamao-forte" />
        </View>

        <View className="flex-row items-center justify-between">
          <TextButton
            label="‹"
            accessibilityLabel="Mês anterior"
            onPress={() => setMonth(shiftMonth(month, -1))}
            textVariant="subtitle"
            textClassName="text-grafite"
            className="items-center"
          />
          <AppText
            variant="heading"
            accessibilityLiveRegion="polite"
            className="text-grafite">
            {monthLabel}
          </AppText>
          <TextButton
            label="›"
            accessibilityLabel="Próximo mês"
            onPress={() => setMonth(shiftMonth(month, 1))}
            textVariant="subtitle"
            textClassName="text-grafite"
            className="items-center"
          />
        </View>

        <View className="flex-row" importantForAccessibility="no-hide-descendants">
          {WEEKDAYS.map((day) => (
            <AppText key={day} variant="caption" className="flex-1 text-center text-grafite-suave">
              {day}
            </AppText>
          ))}
        </View>

        <View className="gap-1">
          {monthGrid(month).map((week, row) => (
            <View key={row} className="flex-row">
              {week.map((date, column) => {
                if (!date) return <View key={`vazio-${column}`} className="flex-1" />;
                const selected = date === selectedDate;
                const frame = selected
                  ? 'bg-mamao-forte'
                  : date === today
                    ? 'border-2 border-mamao-forte'
                    : '';
                return (
                  <Pressable
                    key={date}
                    onPress={() => choose(date)}
                    accessibilityRole="button"
                    accessibilityLabel={`${spokenDay(date)}${date === today ? ', hoje' : ''}`}
                    accessibilityState={{ selected }}
                    style={{ minHeight: MIN_TOUCH_TARGET }}
                    className={`flex-1 items-center justify-center rounded-xl active:opacity-70 ${frame}`}>
                    <AppText className={selected ? 'text-areia' : 'text-grafite'}>
                      {localDateFromIso(date).getDate()}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <TextButton
          label="Ir para hoje"
          onPress={() => choose(today)}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
          className="self-center"
        />
      </SafeAreaView>
    </Modal>
  );
}
