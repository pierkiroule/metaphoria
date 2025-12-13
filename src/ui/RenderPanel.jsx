import './RenderPanel.css'

export function RenderPanel({ echo, prompt, onSendToCloud, cloudResult, cloudEnabled }) {
  return (
    <div className="render-panel">
      <header className="render-header">
        <div>
          <p className="muted">Synthèse locale</p>
          <h3>{echo ? `${echo.emoji} ${echo.metaphors.join(' · ') || 'Attente'}` : 'En attente de mots'}</h3>
        </div>
        <button className="render-action" disabled={!cloudEnabled} onClick={onSendToCloud}>
          {cloudEnabled ? 'Envoyer au cloud IA' : 'IA désactivée'}
        </button>
      </header>
      <section className="render-body">
        <div>
          <h4>Prompt</h4>
          <pre>{prompt}</pre>
        </div>
        <div>
          <h4>Réponse IA (optionnelle)</h4>
          <div className="render-output">
            {cloudResult ? <p>{cloudResult.output}</p> : <p className="muted">Aucune requête envoyée.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}

export default RenderPanel
