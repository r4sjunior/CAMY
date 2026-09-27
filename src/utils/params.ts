/** Parâmetros controláveis pelo usuário. Lidos a cada quadro pelo motor. */
export interface VortexParams {
  /** 0..1 — força de todas as deformações. 0 = câmera pura. */
  intensity: number;
  /** -2..2 — velocidade angular do padrão (negativo inverte). */
  rotationSpeed: number;
  /** Quantidade de cópias da câmera na espiral. */
  cloneCount: number;
  /** -2..2 — velocidade do túnel (positivo = voar para dentro). */
  tunnelSpeed: number;
  /** Voltas completas da espiral do centro até a borda. */
  turns: number;
  /** Tamanho de cada clone em relação ao raio da espiral. */
  cloneSize: number;
  /** 0..1 — persistência do feedback (rastro). */
  trail: number;
  /** 0..1 — brilho (glow). */
  glow: number;
  /** 0..1 — aberração cromática. */
  chroma: number;
  /** 1..12 — fatias do caleidoscópio (1 = desligado). */
  kaleidoscope: number;
}

export const DEFAULT_PARAMS: VortexParams = {
  intensity: 0.7,
  rotationSpeed: 0.6,
  cloneCount: 160,
  tunnelSpeed: 0.6,
  turns: 4,
  cloneSize: 0.75,
  trail: 0.6,
  glow: 0.5,
  chroma: 0.5,
  kaleidoscope: 1,
};

export interface ParamLimit {
  min: number;
  max: number;
  step: number;
}

export const PARAM_LIMITS: Record<keyof VortexParams, ParamLimit> = {
  intensity: { min: 0, max: 1, step: 0.01 },
  rotationSpeed: { min: -2, max: 2, step: 0.05 },
  cloneCount: { min: 12, max: 400, step: 1 },
  tunnelSpeed: { min: -2, max: 2, step: 0.05 },
  turns: { min: 0.5, max: 10, step: 0.1 },
  cloneSize: { min: 0.3, max: 1.4, step: 0.01 },
  trail: { min: 0, max: 1, step: 0.01 },
  glow: { min: 0, max: 1, step: 0.01 },
  chroma: { min: 0, max: 1, step: 0.01 },
  kaleidoscope: { min: 1, max: 12, step: 1 },
};

export interface Preset {
  id: string;
  name: string;
  values: VortexParams;
}

export const PRESETS: Preset[] = [
  { id: 'vortex', name: 'Vórtice', values: DEFAULT_PARAMS },
  {
    id: 'tunnel',
    name: 'Túnel',
    values: {
      intensity: 0.85,
      rotationSpeed: 0.2,
      cloneCount: 240,
      tunnelSpeed: 1.3,
      turns: 1.2,
      cloneSize: 0.95,
      trail: 0.8,
      glow: 0.7,
      chroma: 0.6,
      kaleidoscope: 1,
    },
  },
  {
    id: 'kaleido',
    name: 'Caleidoscópio',
    values: {
      intensity: 0.8,
      rotationSpeed: 0.5,
      cloneCount: 120,
      tunnelSpeed: 0.5,
      turns: 3,
      cloneSize: 0.7,
      trail: 0.7,
      glow: 0.6,
      chroma: 0.4,
      kaleidoscope: 6,
    },
  },
  {
    id: 'acid',
    name: 'Ácido',
    values: {
      intensity: 1,
      rotationSpeed: 1.2,
      cloneCount: 320,
      tunnelSpeed: 1,
      turns: 8,
      cloneSize: 0.6,
      trail: 0.92,
      glow: 0.9,
      chroma: 1,
      kaleidoscope: 1,
    },
  },
];
