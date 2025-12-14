import { useEffect, useMemo, useState } from 'react'
import './App.css'
import CosmoGraph from './components/CosmoGraph'

const STORAGE_KEY = 'echobulles_entries_v1'

const STOPWORDS = new Set([
  'le',
  'la',
  'les',
  'de',
  'du',
  'des',
  'un',
  'une',
  'et',
  'ou',
  'en',
  'dans',
  'pour',
  'par',
  'avec',
  'ce',
  'cet',
  'cette',
  'que',
  'qui',
  'quoi',
  'quand',
  'où',
  'comment',
  'sur',
  'sous',
  'mon',
  'ma',
  'mes',
  'ton',
  'ta',
  'tes',
  'son',
  'sa',
  'ses',
])

const EMOJI_PALETTE = ['🌙', '🚀', '🌳', '🌊', '🔥', '🪶', '✨', '🪨', '🌞', '🌧️']

const SAMPLE_ENTRIES = [
  {
    id: 'entry-1',
    timestamp: Date.now() - 1000 * 60 * 60 * 7,
    text: 'Je cherche du calme et un nouvel élan pour respirer.',
    emoji: '🌙',
    tags: ['calme', 'respiration', 'élan'],
  },
  {
    id: 'entry-2',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    text: 'Je sens mes racines et une braise qui chauffe doucement.',
    emoji: '🌳',
    tags: ['racines', 'braise', 'douceur'],
  },
  {
    id: 'entry-3',
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    text: 'Une flamme crépite, j ai envie de danser et de partir loin.',
    emoji: '🔥',
    tags: ['flamme', 'envie', 'danser', 'voyage'],
  },
  {
    id: 'entry-4',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    text: 'Le vent salé transporte une chanson d eau et de lumière.',
    emoji: '🌊',
    tags: ['vent', 'mer', 'lumière', 'énergie'],
  },
  {
    id: 'entry-5',
    timestamp: Date.now() - 1000 * 60 * 20,
    text: 'Je respire, je m ancre, j écris pour me souvenir.',
    emoji: '🪶',
    tags: ['respiration', 'ancrage', 'écrire', 'mémoire'],
  },
]

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE_ENTRIES
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return SAMPLE_ENTRIES
    return parsed
  } catch (error) {
    console.error('Impossible de charger les entrées locales', error)
    return SAMPLE_ENTRIES
  }
}

function persistEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('Impossible de sauvegarder les entrées locales', error)
  }
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-zà-ÿœæ0-9]+/i)
    .filter((token) => token && token.length > 2 && !STOPWORDS.has(token))
}

function extractTags(text) {
  const tokens = tokenize(text)
  const counts = tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([token]) => token)
}

function suggestEmojis(tags) {
  const hints = tags.join(' ')
  const matches = []
  const hintList = [
    { key: 'calm', emoji: '🌙' },
    { key: 'nuit', emoji: '🌙' },
    { key: 'repos', emoji: '🌙' },
    { key: 'élan', emoji: '🚀' },
    { key: 'envie', emoji: '🚀' },
    { key: 'audace', emoji: '🚀' },
    { key: 'racine', emoji: '🌳' },
    { key: 'terre', emoji: '🌳' },
    { key: 'ancr', emoji: '🌳' },
    { key: 'eau', emoji: '🌊' },
    { key: 'vague', emoji: '🌊' },
    { key: 'flux', emoji: '🌊' },
    { key: 'feu', emoji: '🔥' },
    { key: 'ard', emoji: '🔥' },
    { key: 'passion', emoji: '🔥' },
    { key: 'air', emoji: '🪶' },
    { key: 'léger', emoji: '🪶' },
    { key: 'écrire', emoji: '🪶' },
    { key: 'étoile', emoji: '✨' },
    { key: 'cosmos', emoji: '✨' },
  ]

  hintList.forEach((hint) => {
    if (hints.includes(hint.key) && !matches.includes(hint.emoji)) {
      matches.push(hint.emoji)
    }
  })

  const final = matches.length ? matches : EMOJI_PALETTE
  return final.slice(0, 5)
}

function buildGraph(entries) {
  const nodeMap = new Map()
  const linkSet = new Map()
  const tagCount = new Map()
  const emojiCount = new Map()

  const ensureNode = (id, data) => {
    if (!nodeMap.has(id)) nodeMap.set(id, { ...data })
  }

  const ensureLink = (source, target, weight = 0.6) => {
    const key = `${source}-${target}`
    if (linkSet.has(key)) {
      const existing = linkSet.get(key)
      existing.weight = (existing.weight || 1) + weight
      existing.distance = Math.max(80, 220 - (existing.weight || 1) * 18)
      linkSet.set(key, existing)
    } else {
      linkSet.set(key, { source, target, weight, distance: Math.max(100, 200 - weight * 12) })
    }
  }

  ensureNode('cosmobulle', { id: 'cosmobulle', label: 'Cosmobulle', emoji: '🪨', level: 'metaphor' })

  const emojiToTags = new Map()
  const emojiToEntries = new Map()

  entries.forEach((entry) => {
    const verbatimId = `verbatim-${entry.id}`
    const tokenCount = tokenize(entry.text).length
    ensureNode(verbatimId, {
      id: verbatimId,
      label: entry.text.slice(0, 40) || 'Verbatim',
      level: 'verbatim',
      strength: Math.max(1, Math.min(6, Math.round(tokenCount / 3))),
    })

    const tags = entry.tags || extractTags(entry.text)

    tags.forEach((tag) => {
      const tagId = `tag-${tag}`
      ensureNode(tagId, { id: tagId, label: tag, level: 'tag' })
      tagCount.set(tagId, (tagCount.get(tagId) || 0) + 1)
      if (entry.emoji) {
        ensureLink(tagId, `emoji-${entry.emoji}`, 0.9)
      } else {
        ensureLink(tagId, 'cosmobulle', 0.4)
      }
    })

    if (entry.emoji) {
      const emojiId = `emoji-${entry.emoji}`
      ensureNode(emojiId, { id: emojiId, label: entry.emoji, emoji: entry.emoji, level: 'emoji' })
      emojiCount.set(emojiId, (emojiCount.get(emojiId) || 0) + 1)
      ensureLink('cosmobulle', emojiId, 0.8)
      ensureLink(emojiId, verbatimId, 1)
      tags.forEach((tag) => ensureLink(emojiId, `tag-${tag}`, 0.8))

      emojiToTags.set(emojiId, new Set([...(emojiToTags.get(emojiId) || []), ...tags]))
      emojiToEntries.set(emojiId, [...(emojiToEntries.get(emojiId) || []), entry])
    } else {
      ensureLink('cosmobulle', verbatimId, 0.5)
      tags.forEach((tag) => ensureLink(verbatimId, `tag-${tag}`, 0.4))
    }
  })

  const emojiIds = Array.from(emojiToTags.keys())
  for (let i = 0; i < emojiIds.length; i += 1) {
    for (let j = i + 1; j < emojiIds.length; j += 1) {
      const a = emojiIds[i]
      const b = emojiIds[j]
      const shared = new Set([...emojiToTags.get(a)].filter((tag) => emojiToTags.get(b).has(tag)))
      if (shared.size) {
        ensureLink(a, b, 0.8 + shared.size * 0.35)
      }
    }
  }

  const enrichedNodes = Array.from(nodeMap.values()).map((node) => {
    if (node.level === 'tag') {
      return { ...node, strength: Math.min(8, tagCount.get(node.id) || 1) }
    }
    if (node.level === 'emoji') {
      return { ...node, strength: Math.min(10, 2 + (emojiCount.get(node.id) || 1) * 2) }
    }
    return node
  })

  return { nodes: enrichedNodes, links: Array.from(linkSet.values()), emojiToEntries }
}

function App() {
  const [entered, setEntered] = useState(false)
  const [entries, setEntries] = useState(() => loadEntries())
  const [sourceDraft, setSourceDraft] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    persistEntries(entries)
  }, [entries])

  const graphData = useMemo(() => buildGraph(entries), [entries])

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = sourceDraft.trim()
    if (!text) return
    const tags = extractTags(text)
    const id = `entry-${Date.now()}`
    const entry = { id, timestamp: Date.now(), text, emoji: null, tags }
    setEntries((prev) => [...prev, entry])
    setSourceDraft('')
    setSelectedNode({ type: 'verbatim', entry })
  }

  const handleNodeTap = (node) => {
    if (node.id.startsWith('verbatim-')) {
      const entryId = node.id.replace('verbatim-', '')
      const entry = entries.find((item) => item.id === entryId)
      if (entry) setSelectedNode({ type: 'verbatim', entry })
      return
    }

    if (node.id.startsWith('emoji-')) {
      const emojiId = node.id
      const relatedEntries = graphData.emojiToEntries.get(emojiId) || []
      setSelectedNode({ type: 'emoji', emoji: node.emoji, entries: relatedEntries })
      return
    }

    setSelectedNode(null)
  }

  const handleAssignEmoji = (entryId, emoji) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === entryId ? { ...item, emoji } : item))
    )
  }

  const selectedTags = useMemo(() => {
    if (selectedNode?.type === 'verbatim') return selectedNode.entry.tags || extractTags(selectedNode.entry.text)
    if (selectedNode?.type === 'emoji') {
      const tagSets = (selectedNode.entries || []).map((entry) => entry.tags || extractTags(entry.text))
      return Array.from(new Set(tagSets.flat()))
    }
    return []
  }, [selectedNode])

  const emojiChoices = useMemo(() => suggestEmojis(selectedTags), [selectedTags])

  if (!entered) {
    return (
      <div className="app-shell intro-screen">
        <div className="intro-block">
          <p className="intro-title">Bienvenue dans ÉchoBulles</p>
          <p className="intro-line">Ici, les mots deviennent des bulles.</p>
          <p className="intro-line">Elles flottent, se touchent, résonnent.</p>
          <p className="intro-line">Tu peux les écouter.</p>
          <button type="button" className="primary intro-button" onClick={() => setEntered(true)}>
            Commencer
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
            onNodeTap={handleNodeTap}
            onEmptyTap={() => setSelectedNode(null)}
            onReset={() => setSelectedNode(null)}
          />
        </div>
      </div>

      <div className="detail-panel">
        <div className="panel-head">
          <p className="panel-title">Mémoire vivante</p>
          <p className="panel-sub">Aucune donnée ne quitte cet appareil.</p>
        </div>

        {selectedNode?.type === 'verbatim' && (
          <div className="card">
            <p className="micro-label">Verbatim</p>
            <p className="verbatim-text">{selectedNode.entry.text}</p>
            <div className="tag-row">
              {(selectedNode.entry.tags || []).map((tag) => (
                <span key={tag} className="tag-chip">
                  ✧ {tag}
                </span>
              ))}
            </div>
            <div className="emoji-row">
              <p className="micro-label">Associer un symbole</p>
              <div className="chips">
                {emojiChoices.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`chip ${selectedNode.entry.emoji === emoji ? 'chip-active' : ''}`}
                    onClick={() => handleAssignEmoji(selectedNode.entry.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedNode?.type === 'emoji' && (
          <div className="card">
            <p className="micro-label">Champ sémantique</p>
            <p className="emoji-focus">{selectedNode.emoji}</p>
            <div className="tag-row">
              {selectedTags.map((tag) => (
                <span key={tag} className="tag-chip">
                  ✧ {tag}
                </span>
              ))}
            </div>
            <div className="verbatim-list">
              {(selectedNode.entries || []).map((entry) => (
                <p key={entry.id} className="verbatim-text">
                  {entry.text}
                </p>
              ))}
            </div>
          </div>
        )}

        {!selectedNode && (
          <div className="card">
            <p className="micro-label">Geste</p>
            <p className="verbatim-text">Dépose un mot, puis touche une bulle pour écouter ce qui résonne.</p>
          </div>
        )}
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
