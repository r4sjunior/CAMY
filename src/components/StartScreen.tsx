import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { IconCamera, IconMarkSpiral, IconMarkSquare, IconMarkTarget, IconWormhole } from './Icons';

interface Props {
  webglOk: boolean;
  onStart: () => void;
  onIntent: () => void;
}

export function StartScreen({ webglOk, onStart, onIntent }: Props) {
  const root = useRef<HTMLDivElement>(null);

  // Uma única sequência de entrada: o vórtice se abre, o logo bate (glitch) e o
  // resto do "painel de instrumentos" surge por último.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.start__orb', { scale: 0.55, rotate: -90, opacity: 0, duration: 2 })
        .from('.start__floor', { opacity: 0, duration: 1.2 }, 0.3)
        .from('.start__logo-line', { yPercent: 110, duration: 1, stagger: 0.1 }, 0.5)
        .from('.start__reveal', { opacity: 0, y: 10, duration: 0.8, stagger: 0.06 }, 0.9);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="start" ref={root}>
      {/* ───────── Vórtice decorativo: chão com grade + anel colorido + lente ───────── */}
      <div className="start__visual" aria-hidden="true">
        <div className="start__floor" />
        <div className="start__orb">
          <div className="start__swirl" />
          <div className="start__lens" />
        </div>
      </div>

      {/* ───────── Logo + tagline (canto superior esquerdo) ───────── */}
      <header className="start__brand">
        <h1 className="start__logo" aria-label="Vortex Cam">
          <span className="start__logo-mask">
            <span className="start__logo-line" data-text="VORTEX">
              VORTEX
            </span>
          </span>
          <span className="start__logo-mask">
            <span className="start__logo-line" data-text="CAM">
              CAM
            </span>
          </span>
        </h1>
        <p className="start__tagline start__reveal">
          Capture o invisível.
          <br />
          Transforme a realidade em arte.
        </p>
      </header>

      {/* ───────── HUD: coordenadas + rótulos (canto superior direito) ───────── */}
      <div className="start__coords start__reveal" aria-hidden="true">
        <p>
          22.9068° S
          <br />
          43.1729° W
        </p>
        <span className="start__cross">+</span>
      </div>

      <ul className="start__labels start__reveal" aria-hidden="true">
        <li>Lente</li>
        <li>Movimento</li>
        <li>Tempo</li>
        <li>Infinito</li>
      </ul>

      {/* ───────── HUD: coluna de marcas (borda esquerda) ───────── */}
      <div className="start__marks start__reveal" aria-hidden="true">
        <span className="start__cross">+</span>
        <span className="start__cross">+</span>
        <IconMarkTarget />
        <IconMarkSpiral />
        <IconMarkSquare />
      </div>

      {/* ───────── HUD: selo 360° + moldura wireframe (canto inferior direito) ───────── */}
      <div className="start__badge start__reveal" aria-hidden="true">
        <IconMarkSpiral />
        <p>
          360°
          <br />
          experiência
        </p>
      </div>

      <div className="start__wire start__reveal" aria-hidden="true">
        <IconWormhole />
      </div>

      <div className="start__bars start__reveal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {/* ───────── Conteúdo funcional (âncora inferior esquerda) ───────── */}
      <main className="start__content">
        <p className="start__whisper start__reveal">
          Algumas perspectivas
          <br />
          não deveriam ser vistas.
        </p>

        <button
          type="button"
          className="cta start__reveal"
          onClick={onStart}
          onPointerEnter={onIntent}
          onFocus={onIntent}
          disabled={!webglOk}
        >
          <IconCamera /> Iniciar câmera
        </button>

        {!webglOk && (
          <p className="start__warn start__reveal" role="alert">
            Este navegador não suporta WebGL 2, necessário para o efeito. Tente Chrome, Safari ou Firefox atualizados.
          </p>
        )}

        <p className="start__fine start__reveal">
          O vídeo é processado no seu aparelho e nunca sai dele. O efeito tem rotação e cores intensas, o que pode
          incomodar pessoas sensíveis a imagens piscantes.
        </p>
      </main>
    </div>
  );
}
