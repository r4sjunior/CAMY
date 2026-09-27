// Funções compartilhadas por todos os shaders (concatenadas em shaders/index.ts).
#define VX_PI 3.14159265359
#define VX_TAU 6.28318530718

// Rotação anti-horária (mat2 é column-major).
mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

// Gira o matiz em torno do eixo cinza (1,1,1) — barato e sem conversão HSV.
vec3 hueRotate(vec3 c, float a) {
  const vec3 k = vec3(0.57735026919);
  float ca = cos(a);
  float sa = sin(a);
  return c * ca + cross(k, c) * sa + k * dot(k, c) * (1.0 - ca);
}

// Dobra o plano em n fatias espelhadas (caleidoscópio). n < 2 desliga o efeito.
vec2 kaleido(vec2 p, float n) {
  if (n < 1.5) return p;
  float r = length(p);
  if (r < 1e-5) return p;
  float seg = VX_TAU / n;
  float a = mod(atan(p.y, p.x), seg);
  a = abs(a - 0.5 * seg);
  return r * vec2(cos(a), sin(a));
}

// UV que faz o vídeo cobrir a tela inteira (object-fit: cover).
vec2 coverUv(vec2 uv, float screenAspect, float videoAspect) {
  vec2 c = uv - 0.5;
  if (screenAspect > videoAspect) c.y *= videoAspect / screenAspect;
  else c.x *= screenAspect / videoAspect;
  return c + 0.5;
}
