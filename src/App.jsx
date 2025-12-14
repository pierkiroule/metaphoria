import { useMemo, useState } from 'react'
import './App.css'
import { generateResonantMorphosis } from './resonantMorphosis'
import CosmoGraph from './components/CosmoGraph'
import OverlayEcho from './components/OverlayEcho'

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
  const [debug, setDebug] = useState(false)
  const [echoOverlay, setEchoOverlay] = useState('')

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
    setEchoOverlay('')
  }

  return (
    <div className="app-shell">
      <div className="sky">
        <div className="halo" aria-hidden />
        <div className="graph-stage">
          <CosmoGraph
            nodes={morphosis.graphNodes}
            links={morphosis.graphLinks}
            onEchoLongPress={setEchoOverlay}
            onEmptyTap={() => setEchoOverlay('')}
            onReset={() => setEchoOverlay('')}
            debug={debug}
          />
          <OverlayEcho text={echoOverlay} onClose={() => setEchoOverlay('')} />
        </div>
      </div>

      <form className="input-bar" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="sourceText">
          Dépose ce qui te traverse
        </label>
        <textarea
          id="sourceText"
          name="sourceText"
          value={sourceDraft}
          rows={3}
          onChange={(event) => setSourceDraft(event.target.value)}
          aria-label="Zone de texte pour déposer les mots"
          placeholder="Dépose ce qui te traverse : mots, sensations, emojis…"
        />
        <div className="bar-actions">
          <button type="button" className="ghost" onClick={() => setDebug((value) => !value)}>
            {debug ? 'Masquer debug' : 'Debug'}
          </button>
          <button type="submit" className="primary">
            Diffuser
          </button>
        </div>
      </form>

      {debug && (
        <div className="debug-panel">
          <div>
            <p className="label muted">Nœuds ({morphosis.graphNodes.length})</p>
            <ul className="list">
              {morphosis.graphNodes.map((node) => (
                <li key={node.id} className="list-row">
                  <div>
                    <p className="value">{node.label}</p>
                    <p className="muted">Niveau : {node.level || node.type}</p>
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
      )}
    </div>
  )
}

export default App
