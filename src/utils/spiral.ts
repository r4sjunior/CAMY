export const TAU = Math.PI * 2;

/** Escala do menor clone em relação ao maior (independe da quantidade). */
export const MIN_RATIO = 0.006;
/** ln(1/MIN_RATIO): quanto o túnel "cresce" do fundo até a borda, em log. */
export const LN_RATIO = Math.log(1 / MIN_RATIO);

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const frac = (v: number) => v - Math.floor(v);

/**
 * Espiral logarítmica por semelhança: o clone k+1 é o clone k multiplicado
 * pelo número complexo c = decay · e^(iΔθ).
 *
 *  - decay  = MIN_RATIO^(1/N)      → o último clone tem escala MIN_RATIO
 *  - Δθ     = voltas · 2π / N      → o padrão sempre faz `voltas` giros
 *
 * Assim, mudar N só deixa a espiral mais densa; o formato geral se mantém.
 */
export function spiralShape(count: number, turns: number) {
  return {
    decay: Math.pow(MIN_RATIO, 1 / count),
    dTheta: (turns * TAU) / count,
  };
}
