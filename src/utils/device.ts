export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isMobile = () =>
  isIOS() || /Android/i.test(navigator.userAgent) || window.matchMedia('(pointer: coarse)').matches;

/** Limite de resolução: celulares renderizam menos pixels para segurar 60 FPS. */
export const maxPixelRatio = () => (isMobile() ? 1.5 : 2);

export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
