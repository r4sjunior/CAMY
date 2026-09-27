// VERTEX SHADER — espiral logarítmica de clones + deformação.
//
// Cada instância k é uma cópia do quadro da câmera. Com e = k + fase:
//   escala  s(e) = decay^e
//   raio    R(e) = R0 · s(e)
//   ângulo  θ(e) = e·Δθ + spin
// Ou seja: cada clone é o anterior multiplicado por c = decay·e^{iΔθ}
// (semelhança espiral), o que torna o padrão auto-similar. Deslocar `fase`
// continuamente faz o túnel fluir para sempre sem "pulo" visível.
attribute float aIndex;

uniform float uTime;
uniform float uPhase;
uniform float uCount;
uniform float uIntensity;
uniform float uDecay;
uniform float uDTheta;
uniform float uSpin;
uniform float uAspect;
uniform float uVideoAspect;
uniform float uR0;
uniform float uSize;
uniform float uSwirl;
uniform float uImpulse;
uniform float uTilt;
uniform vec2  uCenter;

varying vec2 vUv;
varying vec2 vLocal;
varying float vE;
varying float vAlpha;

void main() {
  float e = aIndex + uPhase;
  float s = pow(uDecay, e);
  float R = uR0 * s;
  float theta = e * uDTheta + uSpin;

  // Quad do clone (pulsa levemente com o impulso do toque).
  float h = uSize * R * (1.0 + 0.05 * uImpulse * sin(e * 0.35 - uTime * 7.0));
  vec3 q = vec3(position.xy * vec2(uVideoAspect, 1.0) * h, 0.0);

  // Inclinação 3D: cada clone "balança" em eixos diferentes.
  float tx = uTilt * sin(e * 0.21 + uTime * 0.8);
  float ty = uTilt * cos(e * 0.17 - uTime * 0.6);
  q.yz = rot2(tx) * q.yz;
  q.xz = rot2(ty) * q.xz;
  // Orientação ao longo da espiral (topo da imagem aponta para fora).
  q.xy = rot2(theta - 1.5707963) * q.xy;

  vec2 wp = R * vec2(cos(theta), sin(theta)) + q.xy;

  // Deformação por vértice: vórtice (gira mais perto do centro),
  // ondulação radial e distorção de barril.
  float r = length(wp);
  float swirl = (uSwirl * uIntensity * 0.55 + uImpulse * 0.6) / (0.30 + r);
  wp = rot2(swirl) * wp;
  wp *= 1.0 + uIntensity * 0.10 * sin(r * 4.0 - uTime * 1.6 + e * 0.05);
  wp *= 1.0 + 0.10 * uIntensity * r * r;

  // O centro do vórtice segue o dedo/mouse.
  wp += (uCenter - 0.5) * 2.0 * vec2(uAspect, 1.0);

  // Projeção manual com perspectiva leve (w vem da inclinação).
  float persp = max(1.0 - q.z * 0.7, 0.3);
  gl_Position = vec4(wp.x / uAspect, wp.y, 0.0, persp);

  vUv = uv;
  vLocal = position.xy;
  vE = e / uCount;
  // Clones nascem/somem suavemente nas pontas do túnel (loop sem emenda).
  vAlpha = smoothstep(0.0, 1.5, e) * (1.0 - smoothstep(uCount - 2.0, uCount, e));
}
