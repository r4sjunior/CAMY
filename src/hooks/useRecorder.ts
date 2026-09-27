import { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasRecorder, makeFilename, triggerDownload, type SavedRecording } from '../utils/recorder';

export function useRecorder() {
  const ref = useRef<CanvasRecorder | null>(null);
  if (!ref.current) ref.current = new CanvasRecorder();

  const timer = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState<SavedRecording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef<SavedRecording | null>(null);
  savedRef.current = saved;

  const revoke = () => {
    if (savedRef.current) URL.revokeObjectURL(savedRef.current.url);
  };

  useEffect(
    () => () => {
      window.clearInterval(timer.current);
      revoke();
    },
    [],
  );

  const start = useCallback((source: HTMLCanvasElement) => {
    try {
      revoke();
      setSaved(null);
      setError(null);
      ref.current!.start(source);
      setIsRecording(true);
      setSeconds(0);
      const t0 = performance.now();
      window.clearInterval(timer.current);
      timer.current = window.setInterval(() => setSeconds(Math.floor((performance.now() - t0) / 1000)), 250);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar a gravação.');
    }
  }, []);

  const stop = useCallback(async () => {
    window.clearInterval(timer.current);
    setIsRecording(false);
    try {
      const result = await ref.current!.stop();
      const filename = makeFilename(result.extension);
      const url = URL.createObjectURL(result.blob);
      triggerDownload(url, filename); // download automático
      setSaved({ ...result, url, filename });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o vídeo.');
    }
  }, []);

  /** Estável — passado ao motor, que chama a cada quadro. */
  const captureFrame = useCallback((canvas: HTMLCanvasElement) => ref.current!.capture(canvas), []);

  const dismiss = useCallback(() => {
    revoke();
    setSaved(null);
    setError(null);
  }, []);

  return {
    supported: ref.current.supported,
    isRecording,
    seconds,
    saved,
    error,
    start,
    stop,
    captureFrame,
    dismiss,
  };
}
