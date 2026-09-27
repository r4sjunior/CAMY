import { IconEyeOff, IconFlip, IconSliders } from './Icons';
import { RecordButton } from './RecordButton';

interface Props {
  panelOpen: boolean;
  onTogglePanel: () => void;
  recording: boolean;
  recordDisabled: boolean;
  onRecord: () => void;
  canFlip: boolean;
  switching: boolean;
  onFlip: () => void;
  onHide: () => void;
}

export function Toolbar(p: Props) {
  return (
    <nav className="toolbar" aria-label="Ações">
      <button
        type="button"
        className="round"
        data-active={p.panelOpen}
        onClick={p.onTogglePanel}
        aria-label="Controles do efeito"
        aria-expanded={p.panelOpen}
      >
        <IconSliders />
      </button>

      <RecordButton recording={p.recording} disabled={p.recordDisabled} onClick={p.onRecord} />

      <button
        type="button"
        className="round"
        onClick={p.onFlip}
        disabled={!p.canFlip || p.switching || p.recording}
        aria-label="Alternar câmera frontal e traseira"
        data-busy={p.switching}
      >
        <IconFlip />
      </button>

      <button type="button" className="round round--small" onClick={p.onHide} aria-label="Ocultar interface">
        <IconEyeOff />
      </button>
    </nav>
  );
}
