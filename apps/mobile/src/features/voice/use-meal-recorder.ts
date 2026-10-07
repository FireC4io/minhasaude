import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'recorded' | 'denied' | 'error';

/** Gravação curta da refeição falada. O áudio fica no aparelho até existir a transcrição por IA. */
export function useMealRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  async function start() {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setState('denied');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSeconds(0);
      setState('recording');
      timer.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch {
      setState('error');
    }
  }

  async function stop() {
    if (timer.current) clearInterval(timer.current);
    try {
      await recorder.stop();
      setUri(recorder.uri);
      setState('recorded');
    } catch {
      setState('error');
    }
  }

  return { state, seconds, uri, start, stop };
}
