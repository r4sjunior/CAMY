// FRAGMENT SHADER final — vórtice de tela, aberração cromática, glow, vinheta.
uniform sampler2D uScene;
uniform sampler2D uVideo;
uniform vec2  uCenter;
uniform float uAspect;
uniform float uVideoAspect;
uniform float uMirror;
uniform float uTime;
uniform float uIntensity;
uniform float uChroma;
uniform float uGlow;
uniform float uImpulse;
uniform float uKaleido;
uniform float uReady;

varying vec2 vUv;

void main() {
  vec2 p = vUv - uCenter;
  p.x *= uAspect;
  float r = length(p);

  // Vórtice de tela que "respira" + distorção de barril + soco do toque.
  float breath = 0.5 + 0.5 * sin(uTime * 0.5);
  float swirl = (0.10 + 0.25 * breath) * uIntensity / (0.22 + r * 1.4)
              + uImpulse * 0.5 / (0.25 + r * 1.6);
  p = rot2(swirl) * p;
  p *= 1.0 + uIntensity * 0.10 * r * r - uImpulse * 0.10 * exp(-r * 3.0);
  p = kaleido(p, uKaleido);
  p.x /= uAspect;
  vec2 uv = p + uCenter;

  // Aberração cromática radial.
  vec2 off = uv - uCenter;
  float ca = uChroma * (0.02 + 0.08 * uIntensity + 0.12 * uImpulse) * (0.3 + length(off) * 3.0);
  vec3 col;
  col.r = texture2D(uScene, uv + off * ca).r;
  col.g = texture2D(uScene, uv).g;
  col.b = texture2D(uScene, uv - off * ca).b;

  // Glow: 14 amostras em espiral áurea sobre as áreas claras.
  vec3 bloom = vec3(0.0);
  float gr = 0.018 + 0.05 * uGlow;
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float a = fi * 2.3999632;
    float rad = sqrt((fi + 0.5) / 14.0) * gr;
    vec2 o = vec2(cos(a) / uAspect, sin(a)) * rad;
    vec3 s = texture2D(uScene, uv + o).rgb;
    bloom += s * smoothstep(0.15, 0.85, luma(s));
  }
  bloom /= 14.0;
  col += bloom * uGlow * 2.2;

  // Saturação e vinheta crescem com a intensidade.
  col = mix(vec3(luma(col)), col, 1.0 + 0.35 * uIntensity);
  col *= 1.0 - 0.45 * uIntensity * smoothstep(0.55, 1.25, r);

  // Com intensidade 0 a tela mostra só a câmera (preview limpo).
  vec2 vuv = coverUv(vUv, uAspect, uVideoAspect);
  if (uMirror > 0.5) vuv.x = 1.0 - vuv.x;
  vec3 raw = texture2D(uVideo, vuv).rgb * step(0.5, uReady);
  float fx = smoothstep(0.0, 0.12, uIntensity);

  gl_FragColor = vec4(mix(raw, col, fx), 1.0);
}
