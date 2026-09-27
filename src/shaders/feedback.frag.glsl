// FRAGMENT SHADER de feedback — rastro (trail), túnel infinito, vórtice e caleidoscópio.
// Lê o quadro anterior e deforma. Sem câmera crua aqui: os clones (clone.frag.glsl)
// já carregam a imagem da câmera, então o rastro é só o eco deformado deles.
uniform sampler2D uPrev;
uniform vec2  uCenter;
uniform float uAspect;
uniform float uTime;
uniform float uIntensity;
uniform float uTrail;     // persistência por quadro (0..1)
uniform float uZoom;      // zoom por quadro (>0: conteúdo escoa para fora)
uniform float uTwistStep; // rotação por quadro (acompanha a espiral dos clones)
uniform float uSwirl;
uniform float uKaleido;
uniform float uHueStep;   // giro de matiz por quadro (arco-íris no rastro)

varying vec2 vUv;

void main() {
  vec2 p = vUv - uCenter;
  p.x *= uAspect;
  float r = length(p);

  // Vórtice: gira mais perto do centro.
  float vortex = uSwirl * uIntensity * 0.008 / (0.18 + r * 2.2);
  p = rot2(uTwistStep + vortex) * p;

  // Túnel + distorção radial ondulante.
  float ripple = 1.0 + 0.012 * uIntensity * sin(r * 12.0 - uTime * 2.2);
  p *= (1.0 - uZoom) * ripple;

  p = kaleido(p, uKaleido);
  p.x /= uAspect;
  vec2 uv = p + uCenter;

  vec3 prev = texture2D(uPrev, uv).rgb;
  prev = hueRotate(prev, uHueStep);
  // O "- 0.003" evita que valores baixos fiquem presos em 8 bits.
  prev = max(prev * uTrail - 0.003, 0.0);

  gl_FragColor = vec4(prev, 1.0);
}
