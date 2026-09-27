import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import gsap from 'gsap';
import { DEFAULT_PARAMS, type Preset, type VortexParams } from '../utils/params';

interface VortexState {
  params: VortexParams;
  /** Espelha a imagem (câmera frontal funciona como selfie). */
  mirror: boolean;
  /** Id do preset atualmente aplicado (null quando algum slider foi ajustado à mão). */
  presetId: string | null;
  setParam: <K extends keyof VortexParams>(key: K, value: VortexParams[K]) => void;
  setParams: (values: Partial<VortexParams>) => void;
  setMirror: (mirror: boolean) => void;
  reset: () => void;
}

let presetTween: gsap.core.Tween | null = null;

/**
 * O motor lê `useVortexStore.getState()` a cada quadro (fora do React),
 * enquanto os sliders assinam só o valor que exibem.
 */
export const useVortexStore = create<VortexState>()(
  persist(
    (set) => ({
      params: DEFAULT_PARAMS,
      mirror: true,
      presetId: 'vortex',
      setParam: (key, value) => {
        presetTween?.kill();
        set((s) => ({ params: { ...s.params, [key]: value }, presetId: null }));
      },
      setParams: (values) => set((s) => ({ params: { ...s.params, ...values } })),
      setMirror: (mirror) => set({ mirror }),
      reset: () => {
        presetTween?.kill();
        set({ params: DEFAULT_PARAMS, presetId: 'vortex' });
      },
    }),
    {
      name: 'vortex-cam:v1',
      partialize: (s) => ({ params: s.params }),
      merge: (persisted, current) => ({
        ...current,
        params: { ...current.params, ...((persisted as Partial<VortexState> | undefined)?.params ?? {}) },
      }),
    },
  ),
);

/** Transição suave (GSAP) até os valores de um preset. */
export function applyPreset(preset: Preset) {
  presetTween?.kill();
  useVortexStore.setState({ presetId: preset.id });
  const proxy: VortexParams = { ...useVortexStore.getState().params };
  presetTween = gsap.to(proxy, {
    ...preset.values,
    duration: 0.9,
    ease: 'power3.inOut',
    snap: { cloneCount: 1, kaleidoscope: 1 },
    onUpdate: () => useVortexStore.getState().setParams({ ...proxy }),
  });
}
