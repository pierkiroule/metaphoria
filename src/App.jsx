import { useMemo, useState } from 'react'
import './App.css'
import CosmoGraph from './components/CosmoGraph'

const MOCK_GRAPH = {
  nodes: [
    { id: 'cosmobulle', label: 'Cosmobulle', emoji: '🪨', level: 'metaphor' },
    { id: 'calme', label: 'Calme', emoji: '🌙', level: 'emoji' },
    { id: 'elan', label: 'Élan', emoji: '🚀', level: 'emoji' },
    { id: 'racines', label: 'Racines', emoji: '🌳', level: 'emoji' },
    { id: 'vague', label: 'Vague', emoji: '🌊', level: 'emoji' },
    { id: 'braise', label: 'Braise', emoji: '🔥', level: 'emoji' },
    { id: 'plume', label: 'Plume', emoji: '🪶', level: 'emoji' },
    { id: 'etoile', label: 'Étoile', emoji: '✨', level: 'emoji' },
  ],
  links: [
    { source: 'cosmobulle', target: 'calme', weight: 0.9 },
    { source: 'cosmobulle', target: 'elan', weight: 0.85 },
    { source: 'cosmobulle', target: 'racines', weight: 0.9 },
    { source: 'cosmobulle', target: 'vague', weight: 0.85 },
    { source: 'cosmobulle', target: 'braise', weight: 0.82 },
    { source: 'cosmobulle', target: 'plume', weight: 0.8 },
    { source: 'cosmobulle', target: 'etoile', weight: 0.78 },
    { source: 'calme', target: 'elan', weight: 0.6 },
    { source: 'calme', target: 'racines', weight: 0.9 },
    { source: 'racines', target: 'braise', weight: 0.8 },
    { source: 'racines', target: 'vague', weight: 0.7 },
    { source: 'braise', target: 'elan', weight: 0.75 },
    { source: 'vague', target: 'plume', weight: 0.7 },
    { source: 'plume', target: 'etoile', weight: 0.8 },
    { source: 'elan', target: 'etoile', weight: 0.6 },
    { source: 'calme', target: 'plume', weight: 0.55 },
    { source: 'vague', target: 'elan', weight: 0.65 },
  ],
}

const TAG_MAPPINGS = {
  calme: { emoji: '🌙', tags: ['apaisement', 'nuit', 'respiration'] },
  elan: { emoji: '🚀', tags: ['démarrage', 'audace', 'mouvement'] },
  racines: { emoji: '🌳', tags: ['ancrage', 'mémoire', 'famille'] },
  vague: { emoji: '🌊', tags: ['flux', 'lâcher prise', 'cycle'] },
  braise: { emoji: '🔥', tags: ['envie', 'passion', 'chaleur'] },
  plume: { emoji: '🪶', tags: ['léger', 'écrire', 'brise'] },
  etoile: { emoji: '✨', tags: ['guide', 'éclat', 'voeu'] },
  joie: { emoji: '🌞', tags: ['lumière', 'élan', 'danse'] },
  pluie: { emoji: '🌧️', tags: ['lavage', 'renouveau', 'odeur de terre'] },
  vent: { emoji: '🌬️', tags: ['souffle', 'direction', 'mouvement'] },
  pierre: { emoji: '🪨', tags: ['solidité', 'appui', 'gravité'] },
}

const KEYWORD_HINTS = {
  calme: ['calme', 'paisible', 'silence', 'doux', 'repos', 'lune', 'nuit'],
  elan: ['élan', 'depart', 'audace', 'envie', 'bouger', 'mouvement', 'lancer'],
  racines: ['racine', 'terre', 'ancrage', 'famille', 'origin', 'sol', 'tronc'],
  vague: ['vague', 'eau', 'mer', 'flux', 'houle', 'pluie', 'courant'],
  braise: ['feu', 'braise', 'ardeur', 'ardent', 'chaleur', 'flamme', 'volcan'],
  plume: ['plume', 'air', 'léger', 'écrire', 'brise', 'vent', 'souffle'],
  etoile: ['étoile', 'ciel', 'cosmos', 'nuit', 'galaxie', 'lumière', 'briller'],
}

const AVAILABLE_KEYS = Object.keys(TAG_MAPPINGS)

function chooseSemanticKeys(text, tokens) {
  const cleaned = text.toLowerCase()
  const keys = new Set()

  AVAILABLE_KEYS.forEach((key) => {
    if (cleaned.includes(key)) keys.add(key)
  })

  AVAILABLE_KEYS.forEach((key) => {
    const mapping = TAG_MAPPINGS[key]
    const tags = mapping.tags || []
    const hints = KEYWORD_HINTS[key] || []
    const allHints = [...tags, ...hints]
    const match = tokens.some((token) => allHints.some((hint) => token.includes(hint) || hint.includes(token)))
    if (match) keys.add(key)
  })

  if (!keys.size && tokens.length) {
    const first = tokens[0]
    const fallbackKey = AVAILABLE_KEYS.find((key) => KEYWORD_HINTS[key]?.some((hint) => first.includes(hint)))
    if (fallbackKey) {
      keys.add(fallbackKey)
    } else {
      const chosen = AVAILABLE_KEYS[first.charCodeAt(0) % AVAILABLE_KEYS.length]
      keys.add(chosen)
    }
  }

  return Array.from(keys)
}

const PUNCHLINE_LIBRARY = {
  calme: [
    '🌙 Calme : une marée basse qui laisse respirer les rives.',
    '🌙 Calme : la nuit écoute avant de répondre.',
    '🌙 Calme : un velours qui étouffe la tempête.',
  ],
  elan: [
    '🚀 Élan : un saut qui devance la gravité.',
    '🚀 Élan : la fusée qui attend le compte à rebours.',
    '🚀 Élan : une trajectoire inscrite dans l’air.',
  ],
  racines: [
    '🌳 Racines : une pulsation secrète sous le sol.',
    '🌳 Racines : les souvenirs tiennent la terre en place.',
    '🌳 Racines : une lenteur qui nourrit la cime.',
  ],
  vague: [
    '🌊 Vague : une épaule d’eau qui revient toujours.',
    '🌊 Vague : le flux caresse les pierres cachées.',
    '🌊 Vague : un balancement qui apprend le rythme.',
  ],
  braise: [
    '🔥 Braise : un secret incandescent sous la cendre.',
    '🔥 Braise : la chaleur choisit son moment.',
    '🔥 Braise : un rouge qui respire en silence.',
  ],
  plume: [
    '🪶 Plume : une légèreté qui sait raconter.',
    '🪶 Plume : le vent écrit avant qu’on le lise.',
    '🪶 Plume : un geste doux qui remue le ciel.',
  ],
  etoile: [
    '✨ Étoile : un guide discret derrière les nuages.',
    '✨ Étoile : la nuit s’y accroche pour ne pas tomber.',
    '✨ Étoile : un clin d’œil au milieu du noir.',
  ],
}

const DEFAULT_TEXT = ''

function metabolizeTextToGraph(text, graph) {
  const cleaned = text.toLowerCase()
  const tokens = cleaned.split(/[^a-zà-ÿœæ0-9]+/i).filter(Boolean)
  const foundKeys = chooseSemanticKeys(cleaned, tokens)

  const nextNodes = new Map(graph.nodes.map((node) => [node.id, node]))
  const nextLinks = new Map(graph.links.map((link, index) => [`${link.source}-${link.target}-${index}`, link]))

  const ensureLink = (source, target, weight = 0.6) => {
    const id = `${source}-${target}`
    if (![...nextLinks.values()].some((l) => l.source === source && l.target === target)) {
      nextLinks.set(id, { source, target, weight })
    }
  }

  foundKeys.forEach((key) => {
    const mapping = TAG_MAPPINGS[key]
    const emojiId = key
    if (!nextNodes.has(emojiId)) {
      nextNodes.set(emojiId, { id: emojiId, label: key.charAt(0).toUpperCase() + key.slice(1), emoji: mapping.emoji, level: 'emoji' })
      ensureLink('cosmobulle', emojiId, 0.8)
    }

    mapping.tags.forEach((tag) => {
      const tagId = `${emojiId}-${tag}`
      if (!nextNodes.has(tagId)) {
        nextNodes.set(tagId, { id: tagId, label: tag, level: 'tag' })
      }
      ensureLink(emojiId, tagId, 0.7)
    })
  })

  if (foundKeys.length > 1) {
    for (let i = 0; i < foundKeys.length; i += 1) {
      for (let j = i + 1; j < foundKeys.length; j += 1) {
        ensureLink(foundKeys[i], foundKeys[j], 0.75)
      }
    }
  }

  return { nodes: Array.from(nextNodes.values()), links: Array.from(nextLinks.values()) }
}

function App() {
  const [entered, setEntered] = useState(false)
  const [sourceDraft, setSourceDraft] = useState(DEFAULT_TEXT)
  const [murmur, setMurmur] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedPunchlines, setSelectedPunchlines] = useState([])
  const [activeEmoji, setActiveEmoji] = useState(null)
  const [graphData, setGraphData] = useState(MOCK_GRAPH)

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = sourceDraft.trim()
    if (!text) return
    setGraphData((prev) => metabolizeTextToGraph(text, prev))
    setMurmur('Mots déposés. Les bulles s’en souviendront.')
    setSourceDraft('')
  }

  const handleEmojiTap = (node) => {
    setActiveEmoji(node.id)
    setMurmur(`${node.emoji || '✨'} ${node.label}`)
    const tagLines = graphData.links
      .filter((link) => link.source === node.id || link.target === node.id)
      .map((link) => (link.source === node.id ? link.target : link.source))
      .map((id) => graphData.nodes.find((n) => n.id === id))
      .filter((n) => n?.level === 'tag')
      .slice(0, 3)
      .map((tagNode) => `${node.emoji || '✨'} ${node.label} · ${tagNode.label}`)

    const fallback = tagLines.length
      ? tagLines
      : [
          `${node.emoji || '✨'} ${node.label} ouvre une image.`,
          `${node.emoji || '✨'} ${node.label} cherche une rime.`,
          `${node.emoji || '✨'} ${node.label} attend ta voix.`,
        ]

    const lines = PUNCHLINE_LIBRARY[node.id] || fallback
    setSuggestions(lines)
  }

  const handleEmptyTap = () => {
    setActiveEmoji(null)
    setSuggestions([])
    setMurmur('')
  }

  const togglePunchline = (line) => {
    setSelectedPunchlines((prev) => {
      if (prev.includes(line)) return prev.filter((entry) => entry !== line)
      if (prev.length >= 5) return prev
      return [...prev, line]
    })
  }

  const promptPreview = useMemo(() => {
    if (!selectedPunchlines.length) return ''
    return [
      'Brief prêt pour Nebius :',
      '- Context : émergences métaphoriques ÉchoBulles',
      '- Punchlines retenues :',
      ...selectedPunchlines.map((line) => `• ${line}`),
      'Génère une courte histoire et une image poétique.',
    ].join('\n')
  }, [selectedPunchlines])

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
            nodes={graphData.nodes}
            links={graphData.links}
            onMurmur={setMurmur}
            onEmptyTap={handleEmptyTap}
            onReset={handleEmptyTap}
            onNodeTap={handleEmojiTap}
          />
          {murmur && (
            <div className="murmur" role="status" aria-live="polite">
              {murmur}
            </div>
          )}
        </div>
      </div>

      <div className="punch-section">
        <div className="coach-block">
          <p className="coach-title">Punchlines métaphoriques</p>
          {activeEmoji ? <p className="micro-hint">Sélectionne tes 3 préférées</p> : null}
          <div className="chips">
            {suggestions.map((line) => (
              <button
                key={line}
                type="button"
                className={`chip ${selectedPunchlines.includes(line) ? 'chip-active' : ''}`}
                onClick={() => togglePunchline(line)}
              >
                {line}
              </button>
            ))}
            {!suggestions.length && <p className="micro-hint">Tapote un emoji pour révéler des punchlines.</p>}
          </div>
        </div>

        <div className="basket">
          <p className="coach-title">Bulle panier ({selectedPunchlines.length}/5)</p>
          <div className="chips">
            {selectedPunchlines.map((line) => (
              <button key={line} type="button" className="chip chip-active" onClick={() => togglePunchline(line)}>
                {line} ✕
              </button>
            ))}
            {!selectedPunchlines.length && <p className="micro-hint">Ajoute jusqu’à cinq éclats inspirants.</p>}
          </div>
        </div>

        <div className="coach-block">
          <p className="coach-title">Brief Nebius</p>
          <textarea readOnly value={promptPreview} placeholder="Les punchlines retenues forment le brief." />
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
          placeholder="Ajoute tes mots à faire échobuller•°"
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
