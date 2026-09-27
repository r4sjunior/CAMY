import { useEffect, useState } from 'react';
import { canShareFile, shareFile, triggerDownload, type SavedRecording } from '../utils/recorder';
import { IconClose, IconDownload, IconShare } from './Icons';

interface Props {
  saved: SavedRecording | null;
  error: string | null;
  onClose: () => void;
}

export function Toast({ saved, error, onClose }: Props) {
  const [shareable, setShareable] = useState(false);

  useEffect(() => {
    setShareable(saved ? canShareFile(saved) : false);
  }, [saved]);

  useEffect(() => {
    if (!saved && !error) return;
    const t = window.setTimeout(onClose, error ? 6000 : 12000);
    return () => window.clearTimeout(t);
  }, [saved, error, onClose]);

  if (!saved && !error) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      {error ? (
        <p className="toast__text">{error}</p>
      ) : saved ? (
        <>
          <p className="toast__text">
            Vídeo salvo em {saved.extension === 'mp4' ? 'MP4' : 'WebM'}.
            <span className="toast__file">{saved.filename}</span>
          </p>
          <div className="toast__actions">
            {shareable && (
              <button type="button" className="toast__btn" onClick={() => void shareFile(saved).catch(() => undefined)}>
                <IconShare width={18} height={18} /> Compartilhar
              </button>
            )}
            <button type="button" className="toast__btn" onClick={() => triggerDownload(saved.url, saved.filename)}>
              <IconDownload width={18} height={18} /> Baixar de novo
            </button>
          </div>
        </>
      ) : null}
      <button type="button" className="toast__close" onClick={onClose} aria-label="Fechar aviso">
        <IconClose width={18} height={18} />
      </button>
    </div>
  );
}
