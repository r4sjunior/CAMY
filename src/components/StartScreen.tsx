import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { IconCamera } from './Icons';

interface Props {
  webglOk: boolean;
  onStart: () => void;
  onIntent: () => void;
}

export function StartScreen({ webglOk, onStart, onIntent }: Props) {
  const root = useRef<HTMLDivElement>(null);

  // Uma única sequência de entrada: a espiral se abre e o texto sobe em seguida.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.vortex', { scale: 0.4, rotate: -140, opacity: 0, duration: 2.2 })
        .from('.start__line', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.35)
        .from('.start__reveal', { opacity: 0, y: 16, duration: 0.9, stagger: 0.1 }, 0.9);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="start" ref={root}>
      <div className="vortex" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <main className="start__content">
        <h1 className="start__title">
          <span className="start__mask">
            <span className="start__line">Sua câmera,</span>
          </span>
          <span className="start__mask">
            <span className="start__line">em espiral</span>
          </span>
          <span className="start__mask">
            <span className="start__line">infinita.</span>
          </span>
        </h1>

        <p className="start__lead start__reveal">
          Centenas de cópias do seu vídeo giram num túnel fractal, ao vivo. Ajuste, toque na imagem e grave.
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
