import { useEffect, useRef, type RefObject } from 'react';
import { VortexEngine } from '../utils/VortexEngine';
import { useVortexStore } from './useVortexStore';

interface Options {
  canvasRef: RefObject<HTMLCanvasElement>;
  video: HTMLVideoElement;
  onFrame?: (canvas: HTMLCanvasElement) => void;
  onFps?: (fps: number) => void;
  onEngine?: (engine: VortexEngine | null) => void;
  onError?: (message: string) => void;
}

/** Cria o motor Three.js sobre o canvas e o destrói ao desmontar. */
export function useVortexEngine({ canvasRef, video, onFrame, onFps, onEngine, onError }: Options) {
  // Callbacks em ref: trocar de função não recria o WebGL.
  const callbacks = useRef({ onFrame, onFps, onEngine, onError });
  callbacks.current = { onFrame, onFps, onEngine, onError };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: VortexEngine | null = null;
    try {
      engine = new VortexEngine({
        canvas,
        video,
        getParams: () => useVortexStore.getState().params,
        getMirror: () => useVortexStore.getState().mirror,
        onFrame: (c) => callbacks.current.onFrame?.(c),
        onFps: (f) => callbacks.current.onFps?.(f),
      });
      engine.start();
      callbacks.current.onEngine?.(engine);
    } catch (err) {
      console.error('[engine]', err);
      callbacks.current.onError?.('Não foi possível iniciar o WebGL neste dispositivo.');
    }

    return () => {
      callbacks.current.onEngine?.(null);
      engine?.dispose();
    };
  }, [canvasRef, video]);
}
