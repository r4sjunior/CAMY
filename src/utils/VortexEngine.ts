import {
  DoubleSide,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  Mesh,
  MirroredRepeatWrapping,
  NoBlending,
  NormalBlending,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  VideoTexture,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import type { IUniform } from 'three';
import gsap from 'gsap';
import { shaders } from '../shaders';
import { maxPixelRatio } from './device';
import type { VortexParams } from './params';
import { LN_RATIO, TAU, clamp, frac, lerp, spiralShape } from './spiral';

export const MAX_CLONES = 400;
const MIN_QUALITY = 0.6;

export interface VortexEngineOptions {
  canvas: HTMLCanvasElement;
  video: HTMLVideoElement;
  /** Lidos a cada quadro (sem passar pelo React). */
  getParams: () => VortexParams;
  getMirror: () => boolean;
  /** Chamado logo após o render — usado pelo gravador. */
  onFrame?: (canvas: HTMLCanvasElement) => void;
  onFps?: (fps: number) => void;
}

const u = <T>(value: T): IUniform<T> => ({ value });

/**
 * Pipeline por quadro:
 *  1. Passe de cena → RT[write]:  feedback (quadro anterior deformado)  +  N clones instanciados
 *  2. Troca ping-pong (o resultado vira o "quadro anterior" do próximo)
 *  3. Passe final → tela: aberração cromática, glow, vórtice de tela, vinheta
 */
export class VortexEngine {
  readonly canvas: HTMLCanvasElement;

  private readonly opts: VortexEngineOptions;
  private readonly renderer: WebGLRenderer;
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly scene = new Scene();
  private readonly postScene = new Scene();
  private readonly quadGeometry = new PlaneGeometry(2, 2);
  private readonly cloneGeometry: InstancedBufferGeometry;
  private readonly videoTexture: VideoTexture;
  private readonly feedbackMat: ShaderMaterial;
  private readonly cloneMat: ShaderMaterial;
  private readonly postMat: ShaderMaterial;
  private readonly resizeObserver: ResizeObserver;
  private readonly tmpSize = new Vector2();

  private rtRead: WebGLRenderTarget;
  private rtWrite: WebGLRenderTarget;

  private raf = 0;
  private lastTime = 0;
  private disposed = false;

  // Estado animado
  private time = 0;
  private flow = 0;
  private spin = 0;
  private hue = 0;
  private countSmooth: number;
  private aspect = 1;

  // Interação (animados com GSAP)
  private readonly center = { x: 0.5, y: 0.5 };
  private readonly impulse = { v: 0 };
  private pointerId: number | null = null;

  // Qualidade adaptativa / FPS
  private quality = 1;
  private startedAt = 0;
  private fpsFrames = 0;
  private fpsStart = 0;
  private slowTicks = 0;

  constructor(opts: VortexEngineOptions) {
    this.opts = opts;
    this.canvas = opts.canvas;
    this.countSmooth = opts.getParams().cloneCount;

    this.renderer = new WebGLRenderer({
      canvas: opts.canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      // Necessário para a gravação: sem isso, o navegador pode limpar o buffer
      // antes do `drawImage` do CanvasRecorder ler o quadro (efeito some/pisca no vídeo).
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 1);

    // Textura de vídeo atualizada automaticamente (requestVideoFrameCallback quando disponível).
    this.videoTexture = new VideoTexture(opts.video);
    this.videoTexture.minFilter = LinearFilter;
    this.videoTexture.magFilter = LinearFilter;
    this.videoTexture.generateMipmaps = false;

    // Half-float dá rastros suaves; se o aparelho não renderiza em float, cai para 8 bits.
    const ext = this.renderer.extensions;
    const useHalf = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float');
    const rtOptions = {
      type: useHalf ? HalfFloatType : UnsignedByteType,
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: MirroredRepeatWrapping,
      wrapT: MirroredRepeatWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    };
    this.rtRead = new WebGLRenderTarget(2, 2, rtOptions);
    this.rtWrite = new WebGLRenderTarget(2, 2, rtOptions);

    // Geometria instanciada: um quad subdividido (para deformar bem) × MAX_CLONES.
    const plane = new PlaneGeometry(1, 1, 10, 10);
    const g = new InstancedBufferGeometry();
    g.index = plane.index;
    g.setAttribute('position', plane.getAttribute('position'));
    g.setAttribute('uv', plane.getAttribute('uv'));
    const indices = new Float32Array(MAX_CLONES);
    for (let i = 0; i < MAX_CLONES; i++) indices[i] = i;
    g.setAttribute('aIndex', new InstancedBufferAttribute(indices, 1));
    g.instanceCount = MAX_CLONES;
    this.cloneGeometry = g;

    const video = this.videoTexture;

    this.feedbackMat = new ShaderMaterial({
      vertexShader: shaders.fullscreenVert,
      fragmentShader: shaders.feedbackFrag,
      uniforms: {
        uPrev: u<unknown>(null),
        uCenter: u(new Vector2(0.5, 0.5)),
        uAspect: u(1),
        uTime: u(0),
        uIntensity: u(0),
        uTrail: u(0.9),
        uZoom: u(0),
        uTwistStep: u(0),
        uSwirl: u(1),
        uKaleido: u(1),
        uHueStep: u(0),
      },
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });

    this.cloneMat = new ShaderMaterial({
      vertexShader: shaders.cloneVert,
      fragmentShader: shaders.cloneFrag,
      uniforms: {
        uVideo: u(video),
        uTime: u(0),
        uPhase: u(0),
        uCount: u(100),
        uIntensity: u(0),
        uDecay: u(0.97),
        uDTheta: u(0.1),
        uSpin: u(0),
        uAspect: u(1),
        uVideoAspect: u(16 / 9),
        uR0: u(1.3),
        uSize: u(0.75),
        uSwirl: u(1),
        uImpulse: u(0),
        uTilt: u(0.3),
        uCenter: u(new Vector2(0.5, 0.5)),
        uMirror: u(0),
        uChroma: u(0.5),
        uHue: u(0),
        uAlpha: u(0.92),
        uReady: u(0),
      },
      transparent: true,
      blending: NormalBlending,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      forceSinglePass: true, // evita o passe duplo (costas + frente) de materiais transparentes
    });

    this.postMat = new ShaderMaterial({
      vertexShader: shaders.fullscreenVert,
      fragmentShader: shaders.postFrag,
      uniforms: {
        uScene: u<unknown>(null),
        uVideo: u(video),
        uCenter: u(new Vector2(0.5, 0.5)),
        uAspect: u(1),
        uVideoAspect: u(16 / 9),
        uMirror: u(0),
        uTime: u(0),
        uIntensity: u(0),
        uChroma: u(0.5),
        uGlow: u(0.5),
        uImpulse: u(0),
        uKaleido: u(1),
        uReady: u(0),
      },
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });

    const feedbackMesh = new Mesh(this.quadGeometry, this.feedbackMat);
    feedbackMesh.frustumCulled = false;
    const cloneMesh = new Mesh(this.cloneGeometry, this.cloneMat);
    cloneMesh.frustumCulled = false;
    cloneMesh.renderOrder = 1;
    this.scene.add(feedbackMesh, cloneMesh);

    const postMesh = new Mesh(this.quadGeometry, this.postMat);
    postMesh.frustumCulled = false;
    this.postScene.add(postMesh);

    this.resizeObserver = new ResizeObserver(() => this.applySize());
    this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('webglcontextlost', this.onContextLost);
  }

  start() {
    this.applySize();
    this.startedAt = performance.now();
    this.lastTime = this.startedAt;
    this.fpsStart = this.startedAt;
    this.raf = requestAnimationFrame(this.frame);
  }

  /** "Soco" visual: distorção e aberração que decaem em ~1.4s. */
  pulse() {
    gsap.fromTo(this.impulse, { v: 1 }, { v: 0, duration: 1.4, ease: 'expo.out', overwrite: true });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    gsap.killTweensOf(this.center);
    gsap.killTweensOf(this.impulse);
    this.cloneGeometry.dispose();
    this.quadGeometry.dispose();
    this.feedbackMat.dispose();
    this.cloneMat.dispose();
    this.postMat.dispose();
    this.rtRead.dispose();
    this.rtWrite.dispose();
    this.videoTexture.dispose();
    this.renderer.dispose();
  }

  // ─────────────────────────────── loop ───────────────────────────────

  private frame = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);

    const dt = clamp((now - this.lastTime) / 1000, 0.001, 0.05);
    this.lastTime = now;

    this.update(this.opts.getParams(), dt);
    this.render();
    this.opts.onFrame?.(this.canvas);
    this.trackFps(now);
  };

  private update(p: VortexParams, dt: number) {
    const I = clamp(p.intensity, 0, 1);
    const video = this.opts.video;
    const ready = video.readyState >= 2 && video.videoWidth > 0;
    const videoAspect = ready ? video.videoWidth / video.videoHeight : 16 / 9;
    const mirror = this.opts.getMirror() ? 1 : 0;

    // Quantidade de clones muda suavemente ao arrastar o slider.
    const targetN = clamp(p.cloneCount, 8, MAX_CLONES);
    this.countSmooth += (targetN - this.countSmooth) * Math.min(1, dt * 8);
    const N = Math.max(8, this.countSmooth);
    this.cloneGeometry.instanceCount = Math.min(MAX_CLONES, Math.ceil(N) + 1);

    // Integração no tempo (velocidades podem mudar ou inverter sem "pulos").
    this.time += dt;
    this.spin += dt * p.rotationSpeed * 0.9;
    this.flow += (dt * p.tunnelSpeed * N) / 30;
    this.hue = frac(this.hue + dt * 0.05);

    const { decay, dTheta } = spiralShape(N, p.turns);
    // Fase decrescente → clones crescem e escoam para fora (voando para dentro do túnel).
    const phase = 1 - frac(this.flow);

    // Raio do maior clone: cobre a diagonal da tela em qualquer proporção.
    const R0 = 1.15 * Math.sqrt(1 + this.aspect * this.aspect);

    // Velocidade angular do padrão = spin + rotação induzida pelo fluxo ao longo da espiral.
    const omega = p.rotationSpeed * 0.9 - (p.tunnelSpeed * p.turns * TAU) / 30;
    const zoomRate = (p.tunnelSpeed * LN_RATIO) / 30;

    const c = this.cloneMat.uniforms;
    c.uTime.value = this.time;
    c.uPhase.value = phase;
    c.uCount.value = N;
    c.uIntensity.value = I;
    c.uDecay.value = decay;
    c.uDTheta.value = dTheta;
    c.uSpin.value = this.spin;
    c.uAspect.value = this.aspect;
    c.uVideoAspect.value = videoAspect;
    c.uR0.value = R0;
    c.uSize.value = p.cloneSize;
    c.uImpulse.value = this.impulse.v;
    c.uTilt.value = 0.1 + 0.55 * I;
    c.uCenter.value.set(this.center.x, this.center.y);
    c.uMirror.value = mirror;
    c.uChroma.value = p.chroma;
    c.uHue.value = this.hue;
    c.uAlpha.value = 0.92 * clamp(I / 0.12, 0, 1);
    c.uReady.value = ready ? 1 : 0;

    const trailBase = lerp(0.82, 0.985, p.trail);
    const f = this.feedbackMat.uniforms;
    f.uCenter.value.set(this.center.x, this.center.y);
    f.uAspect.value = this.aspect;
    f.uTime.value = this.time;
    f.uIntensity.value = I;
    f.uTrail.value = Math.pow(trailBase, dt * 60);
    f.uZoom.value = 1 - Math.exp(-zoomRate * dt);
    f.uTwistStep.value = -omega * dt;
    f.uKaleido.value = Math.round(p.kaleidoscope);
    f.uHueStep.value = dt * (0.35 + 1.4 * I);

    const q = this.postMat.uniforms;
    q.uCenter.value.set(this.center.x, this.center.y);
    q.uAspect.value = this.aspect;
    q.uVideoAspect.value = videoAspect;
    q.uMirror.value = mirror;
    q.uTime.value = this.time;
    q.uIntensity.value = I;
    q.uChroma.value = p.chroma;
    q.uGlow.value = p.glow;
    q.uImpulse.value = this.impulse.v;
    q.uKaleido.value = Math.round(p.kaleidoscope);
    q.uReady.value = ready ? 1 : 0;
  }

  private render() {
    const r = this.renderer;

    this.feedbackMat.uniforms.uPrev.value = this.rtRead.texture;
    r.setRenderTarget(this.rtWrite);
    r.render(this.scene, this.camera);

    const tmp = this.rtRead;
    this.rtRead = this.rtWrite;
    this.rtWrite = tmp;

    this.postMat.uniforms.uScene.value = this.rtRead.texture;
    r.setRenderTarget(null);
    r.render(this.postScene, this.camera);
  }

  // ───────────────────────────── tamanho / FPS ─────────────────────────────

  private applySize() {
    if (this.disposed) return;
    const host = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, Math.floor(host.clientWidth));
    const h = Math.max(1, Math.floor(host.clientHeight));
    const pr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, maxPixelRatio()) * this.quality);

    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.renderer.getDrawingBufferSize(this.tmpSize);
    this.rtRead.setSize(this.tmpSize.x, this.tmpSize.y);
    this.rtWrite.setSize(this.tmpSize.x, this.tmpSize.y);
    this.aspect = w / h;
  }

  private trackFps(now: number) {
    this.fpsFrames++;
    const elapsed = now - this.fpsStart;
    if (elapsed < 500) return;

    const fps = (this.fpsFrames * 1000) / elapsed;
    this.fpsFrames = 0;
    this.fpsStart = now;
    this.opts.onFps?.(Math.round(fps));

    // Resolução dinâmica: se o aparelho não sustenta ~60 FPS, reduz os pixels (só desce, nunca oscila).
    if (now - this.startedAt < 3000) return;
    this.slowTicks = fps < 48 ? this.slowTicks + 1 : 0;
    if (this.slowTicks >= 4 && this.quality > MIN_QUALITY) {
      this.quality = Math.max(MIN_QUALITY, this.quality - 0.15);
      this.slowTicks = 0;
      this.applySize();
    }
  }

  // ───────────────────────────── interação ─────────────────────────────

  private moveCenter(e: PointerEvent, duration: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0.05, 0.95);
    const y = clamp(1 - (e.clientY - rect.top) / rect.height, 0.05, 0.95);
    gsap.to(this.center, { x, y, duration, ease: 'power3.out', overwrite: true });
  }

  private onPointerDown = (e: PointerEvent) => {
    this.pointerId = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);
    this.moveCenter(e, 0.35);
    this.pulse();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.pointerId === e.pointerId) this.moveCenter(e, 0.25);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.pointerId !== e.pointerId) return;
    this.pointerId = null;
    gsap.to(this.center, { x: 0.5, y: 0.5, duration: 1.4, ease: 'elastic.out(1, 0.45)', overwrite: true });
  };

  private onContextLost = (e: Event) => {
    e.preventDefault(); // permite que o navegador restaure o contexto
  };
}
