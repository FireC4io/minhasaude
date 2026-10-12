import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Linking, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { FormError } from '@/components/ui/form-error';
import { TextButton } from '@/components/ui/text-button';
import { MEAL_TYPE_LABELS } from '@/features/diary/meal-type-labels';
import { addDaysToIsoDate, formatIsoDateLabel, todayIsoDate, weekdayNames } from '@/features/diary/date-utils';
import { SelectChips } from '@/features/onboarding/select-chips';
import { TimeStepper, WeekdayPicker } from '@/features/reminders/reminder-controls';
import { reminderMessage } from '@/features/reminders/reminder-messages';
import { planReminders } from '@/features/reminders/reminder-plan';
import {
  REMINDERS_SUPPORTED,
  requestReminderPermission,
  sendTestReminder,
} from '@/features/reminders/reminder-scheduler';
import {
  REMINDER_ALERTS,
  REMINDER_MEALS,
  REMINDER_TONES,
  WEEKDAYS,
  type ReminderSettings,
} from '@/features/reminders/reminder-settings';
import { updateReminderSettings, useReminderSettings } from '@/features/reminders/reminder-store';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
        {title}
      </AppText>
      {children}
    </View>
  );
}

export default function RemindersScreen() {
  const { t } = useTranslation();
  const settings = useReminderSettings();
  const [permissionError, setPermissionError] = useState<'denied' | 'blocked' | null>(null);
  const update = (patch: Partial<ReminderSettings>) => void updateReminderSettings({ ...settings, ...patch });

  async function toggleMaster(enabled: boolean) {
    setPermissionError(null);
    if (!enabled) return update({ enabled });
    const permission = await requestReminderPermission();
    if (permission !== 'granted') return setPermissionError(permission);
    update({ enabled });
  }

  async function test() {
    await sendTestReminder(settings);
    AccessibilityInfo.announceForAccessibility(t('reminders.testSent'));
  }

  if (!REMINDERS_SUPPORTED) {
    return (
      <View className="flex-1 bg-areia px-6 py-6">
        <AppText className="text-grafite">{t('reminders.webOnly')}</AppText>
      </View>
    );
  }

  const next = planReminders(settings, new Date(), new Set())[0];
  const nextLabel = next
    ? t('reminders.next', {
        when: `${formatIsoDateLabel(next.date)}, ${String(next.at.getHours()).padStart(2, '0')}:${String(next.at.getMinutes()).padStart(2, '0')}`,
      })
    : t('reminders.nextNone');
  const weekdayShort = weekdayNames('short');
  const weekdayLabels = Object.fromEntries(WEEKDAYS.map((d) => [String(d), weekdayShort[d % 7] ?? ''])) as Record<
    string,
    string
  >;
  const example = reminderMessage({ kind: 'meal', meal: 'lunch', date: todayIsoDate() }, settings.tone, false).body;

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-5 px-6 py-6">
      <AppText className="text-grafite">{t('reminders.intro')}</AppText>

      <CheckboxRow label={t('reminders.master')} checked={settings.enabled} onChange={(v) => void toggleMaster(v)} />
      {permissionError ? (
        <View className="gap-2">
          <FormError message={t('reminders.permissionDenied')} />
          <TextButton
            label={t('reminders.openSettings')}
            onPress={() => void Linking.openSettings()}
            className="self-start"
            textClassName="text-mamao-forte"
          />
        </View>
      ) : null}

      {settings.enabled ? (
        <>
          <AppText variant="bodyStrong" accessibilityLiveRegion="polite" className="text-grafite">
            {nextLabel}
          </AppText>

          <Section title={t('reminders.mealsTitle')}>
            {REMINDER_MEALS.map((meal) => {
              const config = settings.meals[meal];
              const name = MEAL_TYPE_LABELS[meal];
              const setMeal = (patch: Partial<typeof config>) =>
                update({ meals: { ...settings.meals, [meal]: { ...config, ...patch } } });
              return (
                <View key={meal} className="gap-1">
                  <CheckboxRow label={name} checked={config.enabled} onChange={(enabled) => setMeal({ enabled })} />
                  {config.enabled ? <TimeStepper name={name} value={config.time} onChange={(time) => setMeal({ time })} /> : null}
                </View>
              );
            })}
            <CheckboxRow
              label={t('reminders.skipIfLogged')}
              checked={settings.skipIfLogged}
              onChange={(skipIfLogged) => update({ skipIfLogged })}
            />
          </Section>

          <Section title={t('reminders.daysTitle')}>
            <WeekdayPicker value={settings.weekdays} onChange={(weekdays) => update({ weekdays })} />
            <AppText variant="caption" className="text-grafite-suave">
              {t('reminders.daysHint')}
            </AppText>
          </Section>

          <Section title={t('reminders.weightTitle')}>
            <CheckboxRow
              label={t('reminders.weightToggle')}
              checked={settings.weight.enabled}
              onChange={(enabled) => update({ weight: { ...settings.weight, enabled } })}
            />
            {settings.weight.enabled ? (
              <>
                <SelectChips
                  label={t('reminders.weightDay')}
                  options={WEEKDAYS.map(String)}
                  optionLabels={weekdayLabels}
                  value={String(settings.weight.weekday)}
                  onChange={(day) => update({ weight: { ...settings.weight, weekday: Number(day) } })}
                />
                <TimeStepper
                  name={t('reminders.weightTitle')}
                  value={settings.weight.time}
                  onChange={(time) => update({ weight: { ...settings.weight, time } })}
                />
              </>
            ) : null}
          </Section>

          <Section title={t('reminders.eveningTitle')}>
            <CheckboxRow
              label={t('reminders.eveningToggle')}
              checked={settings.evening.enabled}
              onChange={(enabled) => update({ evening: { ...settings.evening, enabled } })}
            />
            {settings.evening.enabled ? (
              <TimeStepper
                name={t('reminders.eveningTitle')}
                value={settings.evening.time}
                onChange={(time) => update({ evening: { ...settings.evening, time } })}
              />
            ) : null}
          </Section>

          <Section title={t('reminders.howTitle')}>
            <SelectChips
              label={t('reminders.howTitle')}
              options={REMINDER_ALERTS}
              optionLabels={Object.fromEntries(REMINDER_ALERTS.map((a) => [a, t(`reminders.alerts.${a}`)])) as Record<(typeof REMINDER_ALERTS)[number], string>}
              value={settings.alert}
              onChange={(alert) => update({ alert })}
            />
            <AppText variant="caption" className="text-grafite-suave">
              {t(`reminders.alertHints.${settings.alert}`)}
            </AppText>
            <SelectChips
              label={t('reminders.toneTitle')}
              options={REMINDER_TONES}
              optionLabels={Object.fromEntries(REMINDER_TONES.map((tone) => [tone, t(`reminders.tones.${tone}`)])) as Record<(typeof REMINDER_TONES)[number], string>}
              value={settings.tone}
              onChange={(tone) => update({ tone })}
            />
            <AppText variant="caption" className="text-grafite-suave">
              {t('reminders.toneExample', { text: example })}
            </AppText>
            <CheckboxRow
              label={t('reminders.discreetToggle')}
              checked={settings.discreet}
              onChange={(discreet) => update({ discreet })}
            />
            <AppText variant="caption" className="text-grafite-suave">
              {t('reminders.discreetHint')}
            </AppText>
          </Section>

          <Section title={t('reminders.pauseTitle')}>
            {settings.pausedUntil && settings.pausedUntil >= todayIsoDate() ? (
              <>
                <AppText className="text-grafite">
                  {t('reminders.pausedUntil', { date: formatIsoDateLabel(settings.pausedUntil) })}
                </AppText>
                <TextButton
                  label={t('reminders.resume')}
                  onPress={() => update({ pausedUntil: null })}
                  className="self-start"
                  textClassName="text-mamao-forte"
                />
              </>
            ) : (
              <TextButton
                label={t('reminders.pauseWeek')}
                onPress={() => update({ pausedUntil: addDaysToIsoDate(todayIsoDate(), 6) })}
                className="self-start"
                textClassName="text-mamao-forte"
              />
            )}
          </Section>

          <TextButton
            label={t('reminders.test')}
            hint={t('reminders.testHint')}
            onPress={() => void test()}
            className="items-center"
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
          />
        </>
      ) : null}
    </ScrollView>
  );
}
