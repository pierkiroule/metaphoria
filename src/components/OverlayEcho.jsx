import './OverlayEcho.css'

export default function OverlayEcho({ text, onClose }) {
  if (!text) return null

  return (
    <div className="echo-overlay" role="status" aria-live="polite">
      <p>{text}</p>
      <button type="button" className="overlay-close" onClick={onClose} aria-label="Fermer l'écho">
        ×
      </button>
    </div>
  )
}

