import { useMemo, useState } from 'react'
import './App.css'
import { generateResonantMorphosis } from './resonantMorphosis'
import GraphView from './components/GraphView'
import CosmoGraph from './components/CosmoGraph'

const DEFAULT_TEXT = "Je suis fatigué, tout me semble lourd et je n’avance plus."

const fallbackMorphosis = {
  sourceText: '',
  dominantMetaphoricField: 'Écho discret',
  emoji: '…',
  resonantTags: [
    { id: 'pause', label: 'pause', level: 'tag', strength: 0.4 },
    { id: 'silence', label: 'silence', level: 'tag', strength: 0.35 },
    { id: 'attente', label: 'attente', level: 'tag', strength: 0.35 },
  ],
  metaphoricEchoes: ["Une note suspendue, rien ne se presse encore."],
  graphNodes: [],
  graphLinks: [],
}

function App() {
  const [sourceDraft, setSourceDraft] = useState(DEFAULT_TEXT)
  const [sourceText, setSourceText] = useState(DEFAULT_TEXT)

  const morphosis = useMemo(() => {
    try {
      return generateResonantMorphosis(sourceText)
    } catch (error) {
      console.error('Morphosis error', error)
      return fallbackMorphosis
    }
  }, [sourceText])

  const handleSubmit = (event) => {
    event.preventDefault()
    const next = sourceDraft.trim()
    if (!next) return
    setSourceText(next)
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="brand">Metaphoria</p>
        <h1 className="headline">Echo offline minimal</h1>
        <p className="lede">
          Une version simplifiée pour vérifier que tout s’affiche sans écran blanc. Aucun chargement distant ni moteur de
          graphe.
        </p>
      </header>

      <main className="layout">
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
            <p className="muted">Lecture locale, sans dépendance réseau.</p>
          </div>
          <div className="pill-row">
            <span className="pill">{morphosis.emoji}</span>
            <span className="pill">{morphosis.dominantMetaphoricField}</span>
            {morphosis.resonantTags.map((tag) => {
              const label = typeof tag === 'string' ? tag : tag.label
              const key = typeof tag === 'string' ? tag : tag.id || tag.label
              return (
                <span key={key} className="pill secondary">
                  #{label}
                </span>
              )
            })}
            {!morphosis.resonantTags.length && <span className="pill secondary">Aucun tag disponible</span>}
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
            <h2>Fragments détectés</h2>
            <p className="muted">Liste compacte des nœuds et liens générés.</p>
          </div>

          <GraphView nodes={morphosis.graphNodes} links={morphosis.graphLinks} mode="list" />

          <CosmoGraph nodes={morphosis.graphNodes} links={morphosis.graphLinks} />

          <div className="list-grid">
            <div>
              <p className="label muted">Nœuds ({morphosis.graphNodes.length})</p>
              <ul className="list">
                {morphosis.graphNodes.map((node) => (
                  <li key={node.id} className="list-row">
                    <div>
                      <p className="value">{node.label}</p>
                      <p className="muted">Niveau : {node.level || node.type}</p>
                      <p className="muted subtle">Force : {node.strength?.toFixed ? node.strength.toFixed(2) : node.strength || '1'}</p>
                    </div>
                    <span className="badge">{node.emoji || '•'}</span>
                  </li>
                ))}
                {!morphosis.graphNodes.length && <p className="muted">Aucun fragment détecté.</p>}
              </ul>
            </div>

            <div>
              <p className="label muted">Liens ({morphosis.graphLinks.length})</p>
              <ul className="list">
                {morphosis.graphLinks.map((link) => {
                  const source = morphosis.graphNodes.find((node) => node.id === link.source)
                  const target = morphosis.graphNodes.find((node) => node.id === link.target)
                  return (
                    <li key={link.id || `${link.source}-${link.target}`} className="list-row">
                      <span className="muted">{source?.label || link.source}</span>
                      <span className="badge" aria-hidden>
                        →
                      </span>
                      <span className="muted">{target?.label || link.target}</span>
                    </li>
                  )
                })}
                {!morphosis.graphLinks.length && <p className="muted">Aucun lien disponible.</p>}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
