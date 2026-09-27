import { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from '../utils/device';

export type FacingMode = 'user' | 'environment';
export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error';

function createVideoElement() {
  const v = document.createElement('video');
  v.muted = true;
  v.autoplay = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  // Fora da tela, mas dentro do DOM: o iOS pausa vídeos que não estão anexados.
  Object.assign(v.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '2px',
    height: '2px',
    opacity: '0.01',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  return v;
}

function humanizeError(err: unknown): string {
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'A câmera só funciona em conexão segura (HTTPS) e em navegadores compatíveis.';
  }
  const name = err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permissão da câmera negada. Libere o acesso nas configurações do navegador e tente de novo.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhuma câmera foi encontrada neste dispositivo.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'A câmera está em uso por outro aplicativo. Feche-o e tente de novo.';
    case 'OverconstrainedError':
      return 'A câmera não suporta a configuração pedida.';
    case 'SecurityError':
      return 'O navegador bloqueou a câmera por segurança. Abra o site em HTTPS.';
    default:
      return 'Não foi possível acessar a câmera.';
  }
}

async function getStream(mode: FacingMode): Promise<MediaStream> {
  const size = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } };
  // Do mais específico ao mais tolerante (desktops não têm câmera traseira).
  const attempts: MediaStreamConstraints[] = [
    { audio: false, video: { ...size, facingMode: { exact: mode } } },
    { audio: false, video: { ...size, facingMode: { ideal: mode } } },
    { audio: false, video: true },
  ];
  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'NotFoundError') break;
    }
  }
  throw lastError;
}

export function useCamera() {
  const [video] = useState(createVideoElement);
  const streamRef = useRef<MediaStream | null>(null);
  const requestId = useRef(0);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<FacingMode>('user');
  const [switching, setSwitching] = useState(false);
  const [canFlip, setCanFlip] = useState(false);

  useEffect(() => {
    document.body.appendChild(video);
    const resume = () => {
      if (!document.hidden && streamRef.current && video.paused) void video.play().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', resume);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      video.srcObject = null;
      video.remove();
    };
  }, [video]);

  const open = useCallback(
    async (mode: FacingMode) => {
      const id = ++requestId.current;
      const wasReady = streamRef.current !== null;
      if (wasReady) setSwitching(true);
      else setStatus('requesting');
      setError(null);

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      try {
        const stream = await getStream(mode);
        if (id !== requestId.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        const reported = stream.getVideoTracks()[0]?.getSettings().facingMode;
        setFacing(reported === 'environment' || reported === 'user' ? reported : mode);
        setStatus('ready');

        // Depois da permissão, os rótulos/dispositivos ficam disponíveis.
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCanFlip(devices.filter((d) => d.kind === 'videoinput').length > 1 || isMobile());
      } catch (err) {
        if (id !== requestId.current) return;
        console.error('[camera]', err);
        setError(humanizeError(err));
        setStatus('error');
      } finally {
        if (id === requestId.current) setSwitching(false);
      }
    },
    [video],
  );

  const start = useCallback((mode?: FacingMode) => open(mode ?? facing), [open, facing]);
  const flip = useCallback(() => open(facing === 'user' ? 'environment' : 'user'), [open, facing]);

  return { video, status, error, facing, switching, canFlip, start, flip };
}
