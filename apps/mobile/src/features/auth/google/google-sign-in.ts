import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

/** Client ID "Aplicativo da Web" (não é segredo): o token sai emitido para ele, e a API confere. */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export type GoogleSignInResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | { type: 'unavailable' };

/**
 * O módulo nativo só existe no app instalado (build EAS) no Android. No Expo
 * Go e na web ele não está lá, e importar a biblioteca derruba o app — por
 * isso o botão some nesses casos e o import é feito só na hora de usar.
 */
export function isGoogleSignInAvailable(): boolean {
  return (
    Platform.OS === 'android' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    Boolean(WEB_CLIENT_ID)
  );
}

let configured: GoogleSigninModule | null = null;

function loadGoogleSignin(): GoogleSigninModule {
  if (!configured) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module: GoogleSigninModule = require('@react-native-google-signin/google-signin');
    module.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    configured = module;
  }
  return configured;
}

/** Abre a escolha de conta do Google e devolve o ID token para mandar à API. */
export async function requestGoogleIdToken(): Promise<GoogleSignInResult> {
  if (!isGoogleSignInAvailable()) {
    return { type: 'unavailable' };
  }
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = loadGoogleSignin();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Sempre mostrar a escolha de conta: celular dividido na família é comum.
    await GoogleSignin.signOut();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { type: 'cancelled' };
    }
    if (!response.data.idToken) {
      throw new Error('Google não devolveu o ID token');
    }
    return { type: 'success', idToken: response.data.idToken };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
      return { type: 'cancelled' };
    }
    throw error;
  }
}
