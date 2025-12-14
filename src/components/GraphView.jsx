import '../App.css'

const LEVEL_ORDER = ['metaphor', 'tag', 'word', 'echo']

function getLevelLabel(level) {
  if (level === 'metaphor') return 'Métaphore / champ'
  if (level === 'tag') return 'Tag fort'
  if (level === 'echo') return 'Écho poétique'
  return 'Mot porteur'
}

export default function GraphView({ nodes = [], links = [], mode = 'list' }) {
  const grouped = LEVEL_ORDER.map((level) => ({
    level,
    nodes: nodes.filter((node) => (node.level || node.type) === level),
  })).filter((group) => group.nodes.length)

  return (
    <div className="graph-view" aria-live="polite">
      <div className="graph-view__header">
        <h3>Prévisualisation graphe</h3>
        <p className="muted">
          Mode «{mode}» : structure prête pour D3 / orbitaux, affichage textuel volontairement léger.
        </p>
      </div>

      <div className="graph-view__grid">
        <div className="graph-view__column">
          <p className="label muted">Nœuds ({nodes.length})</p>
          {!nodes.length && <p className="muted">Aucun nœud généré pour l’instant.</p>}
          {grouped.map((group) => (
            <div key={group.level} className="graph-view__group">
              <div className="graph-view__group-head">
                <span className="dot" style={{ background: group.nodes[0]?.color }} aria-hidden />
                <div>
                  <p className="value">{getLevelLabel(group.level)}</p>
                  <p className="muted subtle">{group.nodes.length} éléments · orbite prévue {group.nodes[0]?.orbit || 0}px</p>
                </div>
              </div>
              <ul className="graph-view__list">
                {group.nodes.map((node) => (
                  <li key={node.id} className="graph-view__item">
                    <span className="graph-view__emoji">{node.emoji || '•'}</span>
                    <div>
                      <p className="value">{node.label}</p>
                      <p className="muted subtle">Force {node.strength?.toFixed?.(2) ?? node.strength ?? '1'} · taille {node.size}px</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="graph-view__column">
          <p className="label muted">Liens ({links.length})</p>
          {!links.length && <p className="muted">Aucun lien disponible, la structure reste en attente.</p>}
          <ul className="graph-view__list">
            {links.map((link) => {
              const label = link.id || `${link.source}→${link.target}`
              return (
                <li key={label} className="graph-view__item">
                  <div className="graph-view__link-label">
                    <span className="muted">{link.source}</span>
                    <span aria-hidden className="badge badge-ghost">→</span>
                    <span className="muted">{link.target}</span>
                  </div>
                  <p className="muted subtle">Poids {link.strength?.toFixed?.(2) ?? '1'} · distance orbitale {link.distance || 0}px</p>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

