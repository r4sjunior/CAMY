interface Props {
  recording: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function RecordButton({ recording, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      className="rec"
      data-recording={recording}
      disabled={disabled}
      onClick={onClick}
      aria-label={recording ? 'Parar gravação' : 'Gravar vídeo'}
    >
      <span className="rec__core" />
    </button>
  );
}
