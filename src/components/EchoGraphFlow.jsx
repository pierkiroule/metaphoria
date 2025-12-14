import { Component, useEffect, useMemo, useState } from 'react'

function GraphFallback({ status }) {
  return (
    <div className="graph-wrapper graph-loader">
      <div className="graph-loader-ring" aria-hidden />
      <p className="graph-loader-text">
        {status === 'error'
          ? 'Chargement du graphe indisponible. Vérifie la connexion.'
          : 'Chargement du moteur de graphe...'}
      </p>
    </div>
  )
}

class GraphBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Graph rendering failed', error)
  }

  render() {
    if (this.state.hasError) {
      return <GraphFallback status="error" />
    }

    return this.props.children
  }
}

function GraphList({ nodes = [], links = [], onFocusNode, onSelectionChange, selectedIds = [] }) {
  const nodeLookup = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const sanitizedSelection = useMemo(
    () => selectedIds.filter((id) => nodeLookup.has(id)),
    [nodeLookup, selectedIds],
  )
  const [focusedId, setFocusedId] = useState(null)

  useEffect(() => {
    if (!sanitizedSelection.length) {
      setFocusedId(null)
      onFocusNode?.(null)
      return
    }

    const focusedNode = nodeLookup.get(sanitizedSelection[0])
    if (focusedNode) {
      setFocusedId(focusedNode.id)
      onFocusNode?.(focusedNode)
    }
  }, [nodeLookup, onFocusNode, sanitizedSelection])

  const toggleSelection = (nodeId) => {
    if (!nodeLookup.has(nodeId)) return
    const exists = sanitizedSelection.includes(nodeId)
    const nextIds = exists
      ? sanitizedSelection.filter((id) => id !== nodeId)
      : [...sanitizedSelection, nodeId].slice(-2)

    const nextNodes = nextIds.map((id) => nodeLookup.get(id)).filter(Boolean)
    onSelectionChange?.(nextNodes)
  }

  const handleFocus = (node) => {
    setFocusedId(node.id)
    onFocusNode?.(node)
  }

  const renderNode = (node) => {
    const selected = sanitizedSelection.includes(node.id)
    const focused = focusedId === node.id

    return (
      <li
        key={node.id}
        className={`graph-list-item${selected ? ' selected' : ''}${focused ? ' focused' : ''}`}
      >
        <button
          type="button"
          className="graph-node-button"
          onClick={() => handleFocus(node)}
          onDoubleClick={() => toggleSelection(node.id)}
        >
          <span className="graph-node-emoji" aria-hidden>
            {node.emoji || '⟡'}
          </span>
          <span className="graph-node-text">
            <span className="graph-node-label">{node.label || 'Nœud sans nom'}</span>
            <span className="graph-node-kind">Type : {node.type || node.kind || 'inconnu'}</span>
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="graph-wrapper list-mode">
      <div className="graph-placeholder">
        <p className="graph-state">Vue graphe désactivée · mode liste local</p>
        <p className="muted">Double-clic pour sélectionner · simple clic pour mettre en focus.</p>
      </div>

      <div className="graph-list-columns">
        <div>
          <p className="label muted">Nœuds détectés ({nodes.length})</p>
          <ul className="graph-list-view">{nodes.map(renderNode)}</ul>
          {!nodes.length && <p className="muted">Aucun nœud à afficher.</p>}
        </div>

        <div>
          <p className="label muted">Liens ({links.length})</p>
          <ul className="graph-link-view">
            {links.map((link) => {
              const source = nodeLookup.get(link.source)
              const target = nodeLookup.get(link.target)
              return (
                <li key={link.id || `${link.source}-${link.target}`}> {source?.label || link.source} → {target?.label || link.target}</li>
              )
            })}
          </ul>
          {!links.length && <p className="muted">Aucun lien disponible.</p>}
        </div>
      </div>
    </div>
  )
}

export function EchoGraphFlow(props) {
  return (
    <GraphBoundary>
      <GraphList {...props} />
    </GraphBoundary>
  )
}
