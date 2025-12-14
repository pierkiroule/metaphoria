import { useMemo, useState } from 'react'
import './App.css'
import { generateResonantMorphosis } from './resonantMorphosis'
import { EchoGraphFlow } from './components/EchoGraphFlow'

const DEFAULT_TEXT = "Je suis fatigué, tout me semble lourd et je n’avance plus."
const fallbackMorphosis = {
  sourceText: '',
  dominantMetaphoricField: 'Écho discret',
  emoji: '…',
  resonantTags: ['pause', 'silence', 'attente'],
  metaphoricEchoes: ["Une note suspendue, rien ne se presse encore."],
  graphNodes: [],
  graphLinks: [],
}

function App() {
  const [sourceDraft, setSourceDraft] = useState(DEFAULT_TEXT)
  const [sourceText, setSourceText] = useState(DEFAULT_TEXT)
  const [focusedNode, setFocusedNode] = useState(null)
  const [selectedNodes, setSelectedNodes] = useState([])

  const morphosis = useMemo(() => {
    try {
      return generateResonantMorphosis(sourceText)
    } catch (error) {
      console.error('Morphosis error', error)
      return fallbackMorphosis
    }
  }, [sourceText])

  const notableNodes = useMemo(() => morphosis.graphNodes.slice(0, 8), [morphosis.graphNodes])

  const selectedIds = useMemo(() => selectedNodes.map((node) => node.id), [selectedNodes])

  const handleSubmit = (event) => {
    event.preventDefault()
    const next = sourceDraft.trim()
    if (!next) return
    setFocusedNode(null)
    setSelectedNodes([])
    setSourceText(next)
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="brand">Metaphoria</p>
        <h1 className="headline">Petite page d’accueil</h1>
        <p className="lede">
          Dépose quelques mots, récupère des échos et observe la constellation générée. Tout se fait localement, sans
          appel à une API.
        </p>
      </header>

      <main className="layout">
        <div className="column">
          <section className="panel">
            <form className="form" onSubmit={handleSubmit}>
              <label className="label" htmlFor="sourceText">
                Tes mots
              </label>
              <textarea
                id="sourceText"
                name="sourceText"
                value={sourceDraft}
                rows={4}
                onChange={(event) => setSourceDraft(event.target.value)}
                aria-label="Zone de texte pour déposer les mots"
              />
              <button type="submit" className="button">
                Générer les échos
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="section-head">
              <h2>Échos générés</h2>
              <p className="muted">Lecture directe au chargement, même en mode hors ligne.</p>
            </div>
            <div className="pill-row">
              <span className="pill">{morphosis.emoji}</span>
              <span className="pill">{morphosis.dominantMetaphoricField}</span>
              {morphosis.resonantTags.map((tag) => (
                <span key={tag} className="pill secondary">
                  #{tag}
                </span>
              ))}
              {!morphosis.resonantTags.length && (
                <span className="pill secondary">Aucun tag disponible</span>
              )}
            </div>
            <div className="echoes">
              {morphosis.metaphoricEchoes.map((line, index) => (
                <p key={line} className="echo">
                  {index + 1}. {line}
                </p>
              ))}
              {!morphosis.metaphoricEchoes.length && <p className="muted">Aucun écho pour l’instant.</p>}
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <h2>Fragments notables</h2>
              <p className="muted">Petit aperçu des premiers nœuds détectés.</p>
            </div>
            <ul className="list">
              {notableNodes.map((node) => (
                <li key={node.id} className="list-row">
                  <div>
                    <p className="value">{node.label}</p>
                    <p className="muted">Type : {node.type}</p>
                  </div>
                  <span className="badge">{node.emoji || '•'}</span>
                </li>
              ))}
              {!notableNodes.length && <p className="muted">Aucun fragment détecté.</p>}
            </ul>
          </section>
        </div>

        <section className="panel graph-panel">
          <div className="section-head">
            <h2>Constellation métaphorique</h2>
            <p className="muted">
              Graphe interactif : déplace les nœuds, double-clique pour sélectionner et observer les liens.
            </p>
          </div>

          <EchoGraphFlow
            nodes={morphosis.graphNodes}
            links={morphosis.graphLinks}
            onFocusNode={setFocusedNode}
            onSelectionChange={setSelectedNodes}
            selectedIds={selectedIds}
          />

          <div className="graph-details">
            <div className="detail-block">
              <p className="label muted">Point en focus</p>
              {focusedNode ? (
                <div>
                  <p className="value">{focusedNode.label}</p>
                  <p className="muted">Type : {focusedNode.type}</p>
                </div>
              ) : (
                <p className="muted">Aucun nœud survolé.</p>
              )}
            </div>

            <div className="detail-block">
              <p className="label muted">Sélection (max 2)</p>
              {selectedNodes.length ? (
                <ul className="selection-list">
                  {selectedNodes.map((node) => (
                    <li key={node.id} className="pill secondary">
                      {node.emoji || '•'} {node.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Double-clique sur un nœud pour le marquer.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
