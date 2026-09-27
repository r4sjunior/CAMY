import { useVortexStore } from '../hooks/useVortexStore';
import { PRESETS } from '../utils/params';
import { ParamSlider } from './ParamSlider';

const pct = (v: number) => `${Math.round(v * 100)}%`;
const times = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}×`;
const int = (v: number) => String(Math.round(v));

interface Props {
  open: boolean;
  onPreset: (id: string) => void;
}

export function ControlPanel({ open, onPreset }: Props) {
  const reset = useVortexStore((s) => s.reset);
  const presetId = useVortexStore((s) => s.presetId);

  return (
    <section className="panel" data-open={open} aria-label="Controles do efeito" aria-hidden={!open}>
      <div className="panel__scroll">
        <div className="presets" role="group" aria-label="Estilos prontos">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip"
              data-active={p.id === presetId}
              aria-pressed={p.id === presetId}
              onClick={() => onPreset(p.id)}
              tabIndex={open ? 0 : -1}
            >
              {p.name}
            </button>
          ))}
        </div>

        <ParamSlider param="intensity" label="Intensidade" format={pct} />
        <ParamSlider param="rotationSpeed" label="Velocidade de rotação" format={times} />
        <ParamSlider param="cloneCount" label="Quantidade de clones" format={int} />

        <details className="more">
          <summary>Ajustes avançados</summary>
          <ParamSlider param="tunnelSpeed" label="Velocidade do túnel" format={times} />
          <ParamSlider param="turns" label="Voltas da espiral" format={(v) => v.toFixed(1)} />
          <ParamSlider param="cloneSize" label="Tamanho dos clones" format={pct} />
          <ParamSlider param="trail" label="Rastro" format={pct} />
          <ParamSlider param="glow" label="Brilho" format={pct} />
          <ParamSlider param="chroma" label="Aberração cromática" format={pct} />
          <ParamSlider
            param="kaleidoscope"
            label="Caleidoscópio"
            format={(v) => (v < 2 ? 'Desligado' : `${Math.round(v)} fatias`)}
          />
          <button type="button" className="link-btn" onClick={reset}>
            Restaurar padrões
          </button>
        </details>

        <p className="panel__hint">Toque ou arraste sobre a imagem para mover o centro do vórtice.</p>
      </div>
    </section>
  );
}
