import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Notificação local só existe no app instalado. A web não tem, e no Expo Go
 * (SDK 53+) só importar o expo-notifications derruba o app no Android: aí a
 * tela de lembretes só explica e o resto do app segue funcionando.
 */
export const REMINDERS_SUPPORTED =
  (Platform.OS === 'android' || Platform.OS === 'ios') &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/** Vazio onde não há notificação: todo uso passa antes por `REMINDERS_SUPPORTED`. */
export const Notifications: NotificationsModule = REMINDERS_SUPPORTED
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('expo-notifications') as NotificationsModule)
  : ({} as NotificationsModule);
