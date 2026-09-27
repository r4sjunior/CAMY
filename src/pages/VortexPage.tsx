import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ControlPanel } from '../components/ControlPanel';
import { IconEye } from '../components/Icons';
import { StartScreen } from '../components/StartScreen';
import { Toast } from '../components/Toast';
import { Toolbar } from '../components/Toolbar';
import { useCamera } from '../hooks/useCamera';
import { useRecorder } from '../hooks/useRecorder';
import { applyPreset, useVortexStore } from '../hooks/useVortexStore';
import { hasWebGL2 } from '../utils/device';
import { PRESETS } from '../utils/params';
import type { VortexEngine } from '../utils/VortexEngine';

// Code splitting: Three.js + shaders só são baixados depois do clique em "Iniciar câmera".
const loadStage = () => import('../components/VortexStage');
const VortexStage = lazy(loadStage);

const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function VortexPage() {
  const camera = useCamera();
  const recorder = useRecorder();
  const setMirror = useVortexStore((s) => s.setMirror);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VortexEngine | null>(null);

  const [webglOk] = useState(hasWebGL2);
  const [started, setStarted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(
    () => window.innerWidth >= 900 && window.matchMedia('(pointer: fine)').matches,
  );
  const [uiHidden, setUiHidden] = useState(false);
  const [fps, setFps] = useState(0);
  const [engineError, setEngineError] = useState<string | null>(null);

  useEffect(() => setMirror(camera.facing === 'user'), [camera.facing, setMirror]);

  const handleStart = () => {
    setStarted(true);
    void camera.start('user'); // precisa rodar dentro do gesto do usuário (iOS)
  };

  const handleRecord = useCallback(() => {
    if (recorder.isRecording) void recorder.stop();
    else if (canvasRef.current) recorder.start(canvasRef.current);
  }, [recorder]);

  const handleFlip = useCallback(() => {
    engineRef.current?.pulse();
    void camera.flip();
  }, [camera]);

  const handlePreset = useCallback((id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    applyPreset(preset);
    engineRef.current?.pulse();
  }, []);

  // Atalhos de teclado (desktop): R grava, F alterna a câmera, H oculta a interface.
  useEffect(() => {
    if (!started || camera.status !== 'ready') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'r') handleRecord();
      else if (k === 'f' && camera.canFlip && !recorder.isRecording) handleFlip();
      else if (k === 'h') setUiHidden((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, camera.status, camera.canFlip, recorder.isRecording, handleRecord, handleFlip]);

  const ready = started && camera.status === 'ready';
  const error = camera.error ?? engineError;

  return (
    <div className="app">
      {started && (
        <Suspense fallback={<div className="overlay">Carregando efeitos…</div>}>
          <VortexStage
            canvasRef={canvasRef}
            video={camera.video}
            onFrame={recorder.captureFrame}
            onFps={setFps}
            onEngine={(e) => (engineRef.current = e)}
            onError={setEngineError}
          />
        </Suspense>
      )}

      {!started && <StartScreen webglOk={webglOk} onStart={handleStart} onIntent={() => void loadStage()} />}

      {started && camera.status === 'requesting' && !error && (
        <div className="overlay">Aguardando permissão da câmera…</div>
      )}

      {started && error && (
        <div className="overlay overlay--error" role="alert">
          <div className="card">
            <h2>Não deu para abrir a câmera</h2>
            <p>{error}</p>
            <div className="card__actions">
              <button type="button" className="cta cta--small" onClick={() => void camera.start()}>
                Tentar de novo
              </button>
              <button type="button" className="link-btn" onClick={() => location.reload()}>
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      )}

      {ready && (
        <div className="ui" data-hidden={uiHidden}>
          <header className="topbar">
            <span className="brand">
              <img className="brand__mark" src="/favicon.svg" alt="" width={20} height={20} />
              <span className="brand__text">Vortex Cam</span>
            </span>
            <span className="fps" title="Quadros por segundo">
              {fps} fps
            </span>
          </header>

          {recorder.isRecording && (
            <div className="rec-badge" role="timer" aria-label="Tempo de gravação">
              <i /> {formatTime(recorder.seconds)}
            </div>
          )}

          <ControlPanel open={panelOpen} onPreset={handlePreset} />

          <Toolbar
            panelOpen={panelOpen}
            onTogglePanel={() => setPanelOpen((v) => !v)}
            recording={recorder.isRecording}
            recordDisabled={!recorder.supported}
            onRecord={handleRecord}
            canFlip={camera.canFlip}
            switching={camera.switching}
            onFlip={handleFlip}
            onHide={() => setUiHidden(true)}
          />

          <Toast saved={recorder.saved} error={recorder.error} onClose={recorder.dismiss} />
        </div>
      )}

      {ready && uiHidden && (
        <button type="button" className="show-ui" onClick={() => setUiHidden(false)} aria-label="Mostrar interface">
          <IconEye />
        </button>
      )}
    </div>
  );
}
