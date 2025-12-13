import './EchoCanvas.css'

export function EchoCanvas({ echo }) {
  if (!echo) {
    return (
      <div className="echo-canvas">
        <p className="muted">La constellation apparaîtra après le dépôt des mots.</p>
      </div>
    )
  }

  return (
    <div className="echo-canvas">
      <div className="echo-emoji">{echo.emoji}</div>
      <div className="echo-nodes">
        {echo.nodes.map((node) => (
          <div key={node.id} className={`echo-node echo-node-${node.type}`}>
            <span>{node.label}</span>
            <small>{node.type === 'token' ? 'mot' : 'résonance'}</small>
          </div>
        ))}
      </div>
      <p className="muted">{echo.edges.length} liens symboliques tissés</p>
    </div>
  )
}

export default EchoCanvas
