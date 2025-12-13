import { useMemo, useState } from 'react'
import './App.css'
import { EchoGraph } from './EchoGraph'
import { generateResonantMorphosis } from './resonantMorphosis'

const baseStyles = ['cosmico-poétique', 'contemplatif']
const baseUsages = ['atelier', 'médiation']

function App() {
  const [sourceDraft, setSourceDraft] = useState('Je suis fatigué, tout me semble lourd et je n’avance plus.')
  const [sourceText, setSourceText] = useState('Je suis fatigué, tout me semble lourd et je n’avance plus.')
  const [activeNode, setActiveNode] = useState(null)
  const [pairEcho, setPairEcho] = useState('')

  const morphosis = useMemo(() => generateResonantMorphosis(sourceText), [sourceText])

  const graphNodes = useMemo(() => {
    const styleNodes = baseStyles.map((style) => ({
      id: `style-${style}`,
      type: 'style',
      label: style,
      weight: 1.05,
      emoji: '⟡',
    }))

    const usageNodes = baseUsages.map((usage) => ({
      id: `usage-${usage}`,
      type: 'usage',
      label: usage,
      weight: 1,
      emoji: '⇄',
    }))

    return [...morphosis.graphNodes, ...styleNodes, ...usageNodes]
  }, [morphosis.graphNodes])

  const graphLinks = useMemo(() => {
    const links = [...morphosis.graphLinks]
    const echoNodes = graphNodes.filter((node) => node.type === 'echo')
    const styleNodes = graphNodes.filter((node) => node.type === 'style')
    const usageNodes = graphNodes.filter((node) => node.type === 'usage')

    echoNodes.forEach((echo) => {
      styleNodes.forEach((style) => links.push({ source: style.id, target: echo.id, weight: 0.6 }))
      usageNodes.forEach((usage) => links.push({ source: usage.id, target: echo.id, weight: 0.6 }))
    })

    return links
  }, [graphNodes, morphosis.graphLinks])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!sourceDraft.trim()) return
    setSourceText(sourceDraft)
  }

  const handleGenerateEcho = (pair) => {
    if (pair.length < 2) return
    const [a, b] = pair
    const combined = `Entre ${a.label} et ${b.label}, un fil discret se tend, prêt à porter un nouvel écho.`
    setPairEcho(combined)
  }

  return (
    <div className="cosmic-shell">
      <div className="cosmic-bg" aria-hidden>
        <div className="orb orb-left" />
        <div className="orb orb-right" />
      </div>
      <main className="constellation">
        <header className="intro">
          <p className="eyebrow">Echo from Metaphoria / ECHORESO</p>
          <h1>Graphe d&apos;acteurs-réseaux</h1>
          <p className="lede">
            Chaque mot devient un acteur. Les associations créent le réseau. Tap = focus, tap long = sélectionner. Pinch pour
            zoomer doucement.
          </p>
        </header>

        <section className="graph-panel" aria-label="Graphe acteurs-réseaux">
          <div className="graph-top">
            <div>
              <p className="eyebrow">Texte source</p>
              <p className="hint">Dépose un texte brut : il sera morposé en champs métaphoriques, tags et échos.</p>
            </div>
            <form className="inline-form" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="sourceText">
                Texte source
              </label>
              <textarea
                id="sourceText"
                name="sourceText"
                value={sourceDraft}
                onChange={(event) => setSourceDraft(event.target.value)}
                placeholder="Je suis fatigué, tout me semble lourd..."
                rows={3}
              />
              <button type="submit" className="ghost-button">
                Résonner
              </button>
            </form>
          </div>
          <div className="graph-shell" role="presentation">
            <EchoGraph nodes={graphNodes} links={graphLinks} onSelectNode={setActiveNode} onGenerateEcho={handleGenerateEcho} />
          </div>
        </section>

        <section className="resonance-deck" aria-label="Résonances visibles">
          <div className="deck-card">
            <p className="section-label">Nœud actif</p>
            <p className="prompt-text">
              {activeNode ? `${activeNode.emoji || ''} ${activeNode.label}` : 'Tap un nœud pour révéler son souffle.'}
            </p>
            <p className="hint">Taille = poids symbolique. Couleur = type de nœud.</p>
          </div>
          <div className="deck-card">
            <p className="section-label">Texte brut</p>
            <p className="prompt-text">{morphosis.sourceText || 'Rien de saisi pour le moment.'}</p>
            <p className="hint">Le texte est déplacé symboliquement, sans interprétation.</p>
          </div>
          <div className="deck-card">
            <p className="section-label">Morphose dominante</p>
            <p className="prompt-text metaphor-theme">
              <span className="metaphor-emoji" aria-hidden>
                {morphosis.emoji}
              </span>
              {morphosis.dominantMetaphoricField}
            </p>
            <div className="chip-row">
              {morphosis.resonantTags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="chip subtle-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="deck-card">
            <p className="section-label">Échos métaphoriques</p>
            <ul className="punchline-list">
              {morphosis.metaphoricEchoes.map((line, index) => (
                <li key={`${line}-${index}`} className="prompt-text punchline-line">
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="deck-card">
            <p className="section-label">Écho tissé</p>
            <p className="prompt-text">{pairEcho || 'Sélectionne deux nœuds (tap long) pour tisser un nouvel écho.'}</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
