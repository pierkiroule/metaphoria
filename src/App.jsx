import { useMemo, useState } from 'react'
import './App.css'
import EchoGraphD3 from './components/EchoGraphD3'

const initialNodes = [
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'lenteur', label: 'Lenteur' },
  { id: 'nuit', label: 'Nuit' },
  { id: 'souffle', label: 'Souffle' },
]

const initialLinks = [
  { source: 'fatigue', target: 'lenteur' },
  { source: 'fatigue', target: 'nuit' },
  { source: 'souffle', target: 'lenteur' },
]

function App() {
  const [nodes, setNodes] = useState(initialNodes)
  const [links, setLinks] = useState(initialLinks)
  const [word, setWord] = useState('')
  const [focusId, setFocusId] = useState(null)

  const focusedNode = useMemo(
    () => nodes.find((node) => node.id === focusId),
    [nodes, focusId],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    const raw = word.trim()
    if (!raw) return

    const id = raw.toLowerCase()
    const exists = nodes.some((node) => node.id === id)

    if (!exists) {
      setNodes((prev) => [...prev, { id, label: raw }])
      setLinks((prev) => {
        const last = prev.length ? prev[prev.length - 1].target : null
        const fallback = nodes.length ? nodes[nodes.length - 1].id : null
        const connectFrom = last || fallback
        if (!connectFrom) return prev
        if (connectFrom === id) return prev
        return [...prev, { source: connectFrom, target: id }]
      })
    }

    setFocusId(id)
    setWord('')
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">EchoBulle</p>
          <h1>Cosmobulle vivante</h1>
          <p className="lede">
            Bienvenue dans la cosmobulle. Ici, les mots deviennent des métabulles,
            flottent, se touchent parfois, et résonnent quand on les écoute.
          </p>
        </div>
        <div className="hint">
          Tapoter pour écouter · Double tap pour relier · Pincer pour zoomer · Glisser
          pour flotter.
        </div>
      </header>

      <main className="cosmobulle">
        <div className="graph-card">
          <EchoGraphD3 nodes={nodes} links={links} onNodeTap={setFocusId} />
        </div>

        <aside className="panel">
          <section className="panel-section">
            <h2>Dépose un mot</h2>
            <form className="word-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="word">
                Nouveau mot
              </label>
              <input
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Ajouter une métabulle..."
                autoComplete="off"
              />
              <button type="submit">Lâcher</button>
            </form>
            <p className="microcopy">Une cosmobulle se nourrit mot après mot.</p>
          </section>

          <section className="panel-section">
            <h3>Métabulles actives</h3>
            <ul className="bubble-list">
              {nodes.map((node) => (
                <li key={node.id} className={node.id === focusId ? 'active' : ''}>
                  {node.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-section">
            <h3>Écho de la cosmobulle</h3>
            {focusedNode ? (
              <p className="echo">{focusedNode.label} cherche sa résonance.</p>
            ) : (
              <p className="echo">Choisis une métabulle pour l&apos;écouter.</p>
            )}
          </section>
        </aside>
      </main>

      <footer className="footer">Semer des métabulles. Écouter ce qui résonne.</footer>
    </div>
  )
}

export default App
