import { useMemo, useState } from 'react'
import './App.css'
import { generateResonantMorphosis } from './resonantMorphosis'

const DEFAULT_TEXT = "Je suis fatigué, tout me semble lourd et je n’avance plus."

function App() {
  const [sourceDraft, setSourceDraft] = useState(DEFAULT_TEXT)
  const [sourceText, setSourceText] = useState(DEFAULT_TEXT)

  const morphosis = useMemo(() => generateResonantMorphosis(sourceText), [sourceText])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!sourceDraft.trim()) return
    setSourceText(sourceDraft.trim())
  }

  const notableNodes = useMemo(() => {
    return morphosis.graphNodes.slice(0, 12)
  }, [morphosis.graphNodes])

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Metaphoria</p>
          <h1 className="title">Échos discrets</h1>
          <p className="subtitle">
            Dépose quelques mots pour générer un petit ensemble de tags et d’images. Aucun graph, juste le
            nécessaire.
          </p>
        </div>
      </header>

      <main className="main">
        <section className="card">
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
              Générer
            </button>
          </form>
        </section>

        <section className="card">
          <div className="section-header">
            <h2>Résultat</h2>
            <p className="muted">Basé sur le texte courant. Pas de mise en scène, juste les données.</p>
          </div>
          <div className="grid">
            <div>
              <p className="muted">Champ dominant</p>
              <p className="value">
                {morphosis.emoji} {morphosis.dominantMetaphoricField}
              </p>
            </div>
            <div>
              <p className="muted">Tags résonants</p>
              <div className="pill-row">
                {morphosis.resonantTags.length ? (
                  morphosis.resonantTags.map((tag) => (
                    <span key={tag} className="pill">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="pill muted">Aucun tag</span>
                )}
              </div>
            </div>
          </div>
          <div className="echoes">
            {morphosis.metaphoricEchoes.map((line, index) => (
              <p key={line} className="echo-line">
                {index + 1}. {line}
              </p>
            ))}
            {!morphosis.metaphoricEchoes.length && <p className="muted">Aucun écho pour l’instant.</p>}
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <h2>Fragments</h2>
            <p className="muted">Premiers nœuds identifiés. Lecture simple, sans interactions.</p>
          </div>
          <div className="node-list" role="list">
            {notableNodes.map((node) => (
              <div key={node.id} className="node-row" role="listitem">
                <div>
                  <p className="value">{node.label}</p>
                  <p className="muted">Type : {node.type}</p>
                </div>
                <span className="badge">{node.emoji || '•'}</span>
              </div>
            ))}
            {!notableNodes.length && <p className="muted">Aucun fragment détecté.</p>}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
