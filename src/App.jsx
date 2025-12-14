import { useMemo, useState } from 'react'
import './App.css'
import { generateResonantMorphosis } from './resonantMorphosis'
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
  const [murmur, setMurmur] = useState('')
  const [entered, setEntered] = useState(false)

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

  if (!entered) {
    return (
      <div className="app-shell intro-screen">
        <div className="intro-block">
          <p className="intro-title">🫧 ÉchoBulles · Metaphoria</p>
          <p className="intro-line">Dépose ce qui te traverse.</p>
          <p className="intro-line">Mots. Corps. Images. Émojis.</p>
          <button type="button" className="primary intro-button" onClick={() => setEntered(true)}>
            Entrer dans la cosmobulle
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="sky">
        <div className="halo" aria-hidden />
        <div className="graph-stage">
          <CosmoGraph
            nodes={morphosis.graphNodes}
            links={morphosis.graphLinks}
            onMurmur={setMurmur}
            onEmptyTap={() => setMurmur('')}
            onReset={() => setMurmur('')}
          />
          {murmur && (
            <div className="murmur" role="status" aria-live="polite">
              {murmur}
            </div>
          )}
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
          <button type="submit" className="primary">
            Diffuser
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
