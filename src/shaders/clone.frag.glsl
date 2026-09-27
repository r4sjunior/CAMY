// FRAGMENT SHADER dos clones — swirl local, aberração cromática, tinta e borda neon.
uniform sampler2D uVideo;
uniform float uTime;
uniform float uIntensity;
uniform float uChroma;
uniform float uMirror;
uniform float uHue;
uniform float uAlpha;
uniform float uReady;
uniform float uVideoAspect;

varying vec2 vUv;
varying vec2 vLocal;
varying float vE;
varying float vAlpha;

void main() {
  if (vAlpha < 0.003 || uReady < 0.5) discard;

  vec2 uv = vUv;
  if (uMirror > 0.5) uv.x = 1.0 - uv.x;

  // Swirl dentro do clone + leve "bulge" no centro.
  vec2 c = uv - 0.5;
  float r = length(c);
  float centerMask = 1.0 - smoothstep(0.0, 0.7, r);
  c = rot2(uIntensity * 0.9 * sin(uTime * 0.7 + vE * 9.0) * centerMask) * c;
  c *= 1.0 - 0.18 * uIntensity * centerMask;
  vec2 base = c + 0.5;

  // Aberração cromática radial (R e B deslocados em sentidos opostos).
  vec2 dir = normalize(c + vec2(1e-5));
  float ca = (0.003 + 0.02 * uChroma * uIntensity) * (0.35 + r);
  vec3 col;
  col.r = texture2D(uVideo, base + dir * ca).r;
  col.g = texture2D(uVideo, base).g;
  col.b = texture2D(uVideo, base - dir * ca).b;

  // Cada clone recebe uma cor de uma roda que gira com o tempo.
  float hue = fract(vE * 2.5 + uHue);
  vec3 tint = hsv2rgb(vec3(hue, 0.75, 1.0));
  float l = luma(col);
  col = mix(col, col * (0.6 + 1.1 * tint), 0.45 * uIntensity);
  col = mix(vec3(l), col, 1.0 + 0.6 * uIntensity);

  // Moldura neon com espessura constante (em unidades de altura).
  float dEdge = min((0.5 - abs(vLocal.x)) * uVideoAspect, 0.5 - abs(vLocal.y));
  float rim = 1.0 - smoothstep(0.0, 0.035, dEdge);
  col += tint * rim * (0.15 + 0.6 * uIntensity);

  float feather = smoothstep(0.0, 0.006, dEdge);
  gl_FragColor = vec4(col, vAlpha * uAlpha * feather);
}
