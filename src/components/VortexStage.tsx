import type { RefObject } from 'react';
import { useVortexEngine } from '../hooks/useVortexEngine';
import type { VortexEngine } from '../utils/VortexEngine';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
  video: HTMLVideoElement;
  onFrame?: (canvas: HTMLCanvasElement) => void;
  onFps?: (fps: number) => void;
  onEngine?: (engine: VortexEngine | null) => void;
  onError?: (message: string) => void;
}

/** Carregado sob demanda (React.lazy): é aqui que o Three.js entra no bundle. */
export default function VortexStage({ canvasRef, video, onFrame, onFps, onEngine, onError }: Props) {
  useVortexEngine({ canvasRef, video, onFrame, onFps, onEngine, onError });

  return (
    <div className="stage">
      <canvas ref={canvasRef} className="stage__canvas" aria-label="Efeito de vórtice em tempo real" />
    </div>
  );
}
