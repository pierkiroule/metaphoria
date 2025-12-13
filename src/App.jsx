import { useMemo, useState } from 'react'
import './App.css'
import { EchoGraph } from './EchoGraph'
import { generateMetaphoricEcho } from './metaphoricEcho'

const baseWords = ['brume', 'souffle', 'nuit', 'reflet']
const baseStyles = ['cosmico-poétique', 'contemplatif']
const baseUsages = ['atelier', 'médiation']

function App() {
  const [input, setInput] = useState('éclat\npierre\nrespiration')
  const [words, setWords] = useState(baseWords)
  const [activeNode, setActiveNode] = useState(null)
  const [pairEcho, setPairEcho] = useState('')

  const metaphoricEcho = useMemo(() => generateMetaphoricEcho(words), [words])

  const graphNodes = useMemo(() => {
    const limitedWords = words.slice(-10)
    const wordNodes = limitedWords.map((word, index) => ({
      id: `word-${word}-${index}`,
      type: 'word',
      label: word,
      weight: 1 + (limitedWords.length - index) * 0.08,
      emoji: '•',
    }))

    const tagNodes = metaphoricEcho.tags.map((tag, index) => ({
      id: `tag-${tag}-${index}`,
      type: 'tag',
      label: tag,
      weight: 1.3,
      emoji: '✧',
    }))

    const metaphorNode = {
      id: `metaphor-${metaphoricEcho.theme}`,
      type: 'metaphor',
      label: metaphoricEcho.theme,
      weight: 2.1,
      emoji: metaphoricEcho.emoji,
    }

    const echoNodes = metaphoricEcho.punchlines.map((line, index) => ({
      id: `echo-${index}`,
      type: 'echo',
      label: line,
      weight: 1.4,
      emoji: '🫧',
    }))

    const styleNodes = baseStyles.map((style) => ({
      id: `style-${style}`,
      type: 'style',
      label: style,
      weight: 1.1,
      emoji: '⟡',
    }))

    const usageNodes = baseUsages.map((usage) => ({
      id: `usage-${usage}`,
      type: 'usage',
      label: usage,
      weight: 1,
      emoji: '⇄',
    }))

    return [...wordNodes, ...tagNodes, metaphorNode, ...echoNodes, ...styleNodes, ...usageNodes]
  }, [metaphoricEcho.emoji, metaphoricEcho.punchlines, metaphoricEcho.tags, metaphoricEcho.theme, words])

  const graphLinks = useMemo(() => {
    const links = []
    const wordNodes = graphNodes.filter((node) => node.type === 'word')
    const tagNodes = graphNodes.filter((node) => node.type === 'tag')
    const metaphorNode = graphNodes.find((node) => node.type === 'metaphor')
    const echoNodes = graphNodes.filter((node) => node.type === 'echo')
    const styleNodes = graphNodes.filter((node) => node.type === 'style')
    const usageNodes = graphNodes.filter((node) => node.type === 'usage')

    wordNodes.forEach((node, index) => {
      const tagTarget = tagNodes[index % tagNodes.length]
      if (tagTarget) {
        links.push({ source: node.id, target: tagTarget.id, weight: 1.2 })
      }
    })

    tagNodes.forEach((node) => {
      if (metaphorNode) links.push({ source: node.id, target: metaphorNode.id, weight: 1.5 })
    })

    echoNodes.forEach((echo) => {
      if (metaphorNode) links.push({ source: metaphorNode.id, target: echo.id, weight: 1.8 })
      styleNodes.forEach((style) => links.push({ source: style.id, target: echo.id, weight: 0.6 }))
      usageNodes.forEach((usage) => links.push({ source: usage.id, target: echo.id, weight: 0.6 }))
    })

    return links
  }, [graphNodes])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!input.trim()) return

    const incomingWords = input
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean)

    if (!incomingWords.length) return

    setWords((previous) => [...previous, ...incomingWords])
    setInput('')
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
              <p className="eyebrow">Dépôt rapide</p>
              <p className="hint">Ajoute quelques mots ou intentions, ils se relient au graphe.</p>
            </div>
            <form className="inline-form" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="words">
                Mots à déposer
              </label>
              <textarea
                id="words"
                name="words"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="brume, souffle, nuit..."
                rows={2}
              />
              <button type="submit" className="ghost-button">
                Insérer
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
            <p className="section-label">Thème métaphorique</p>
            <p className="prompt-text metaphor-theme">
              <span className="metaphor-emoji" aria-hidden>
                {metaphoricEcho.emoji}
              </span>
              {metaphoricEcho.theme}
            </p>
            <div className="chip-row">
              {metaphoricEcho.tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="chip subtle-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="deck-card">
            <p className="section-label">Échos poétiques</p>
            <ul className="punchline-list">
              {metaphoricEcho.punchlines.map((line, index) => (
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
