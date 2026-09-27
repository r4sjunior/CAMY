export type VideoExtension = 'mp4' | 'webm';

interface RecorderFormat {
  mimeType: string;
  extension: VideoExtension;
}

/** MP4 primeiro (abre em qualquer lugar); WebM como alternativa. */
const CANDIDATES: RecorderFormat[] = [
  { mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' },
  { mimeType: 'video/mp4', extension: 'mp4' },
  { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
  { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
  { mimeType: 'video/webm', extension: 'webm' },
];

export function pickRecorderFormat(): RecorderFormat | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mimeType)) ?? null;
}

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  extension: VideoExtension;
}

export interface SavedRecording extends RecordingResult {
  url: string;
  filename: string;
}

const MAX_SIDE = 1920;

/**
 * Grava o canvas WebGL copiando cada quadro para um canvas 2D intermediário.
 * Isso evita depender de `preserveDrawingBuffer` (que custa FPS no celular),
 * funciona no Safari e garante largura/altura pares (exigência do H.264).
 */
export class CanvasRecorder {
  private readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d', { alpha: false });
  private readonly format = pickRecorderFormat();
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  get supported() {
    return typeof MediaRecorder !== 'undefined' && !!this.ctx;
  }

  get isRecording() {
    return this.recorder?.state === 'recording';
  }

  start(source: HTMLCanvasElement) {
    if (!this.supported) throw new Error('Gravação de vídeo não é suportada neste navegador.');

    const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
    const w = Math.max(2, Math.floor((source.width * scale) / 2) * 2);
    const h = Math.max(2, Math.floor((source.height * scale) / 2) * 2);
    this.canvas.width = w;
    this.canvas.height = h;

    this.stream = this.canvas.captureStream(60);
    const options: MediaRecorderOptions = {
      videoBitsPerSecond: Math.round(Math.min(12e6, Math.max(4e6, w * h * 30 * 0.15))),
    };
    if (this.format) options.mimeType = this.format.mimeType;

    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, options);
    this.recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) this.chunks.push(ev.data);
    };
    // Sem timeslice: um único blob completo em `stop()`. Com timeslice, os pedaços
    // de MP4 gerados pelo Safari não são concatenáveis e o vídeo final fica corrompido.
    this.recorder.start();
  }

  /** Chame logo depois de renderizar cada quadro. */
  capture(source: HTMLCanvasElement) {
    if (!this.isRecording || !this.ctx) return;
    this.ctx.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
  }

  stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      const rec = this.recorder;
      if (!rec) {
        reject(new Error('Nenhuma gravação em andamento.'));
        return;
      }
      rec.onerror = () => {
        this.cleanup();
        reject(new Error('Falha durante a gravação.'));
      };
      rec.onstop = () => {
        const mimeType = rec.mimeType || this.format?.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.cleanup();
        if (blob.size === 0) {
          reject(new Error('A gravação ficou vazia. Tente gravar por mais alguns segundos.'));
          return;
        }
        resolve({ blob, mimeType, extension: mimeType.includes('mp4') ? 'mp4' : 'webm' });
      };
      if (rec.state === 'inactive') {
        this.cleanup();
        reject(new Error('A gravação já foi encerrada.'));
        return;
      }
      rec.stop();
    });
  }

  private cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
  }
}

export function makeFilename(extension: VideoExtension) {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `vortex-cam-${stamp}.${extension}`;
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function canShareFile(saved: SavedRecording): boolean {
  try {
    const file = toFile(saved);
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function shareFile(saved: SavedRecording) {
  await navigator.share({ files: [toFile(saved)], title: 'Vortex Cam' });
}

function toFile(saved: SavedRecording) {
  return new File([saved.blob], saved.filename, { type: saved.mimeType.split(';')[0] });
}
