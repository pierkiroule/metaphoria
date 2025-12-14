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
  const [suggestions, setSuggestions] = useState([])
  const [selectedPunchlines, setSelectedPunchlines] = useState([])
  const [comboEcho, setComboEcho] = useState('')

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

  const nodeMap = useMemo(() => new Map((morphosis.graphNodes || []).map((node) => [node.id, node])), [
    morphosis.graphNodes,
  ])

  const linkedTagsFor = (nodeId) => {
    const related = new Set()
    morphosis.graphLinks?.forEach((link) => {
      if (link.source === nodeId) related.add(link.target)
      if (link.target === nodeId) related.add(link.source)
    })
    return Array.from(related)
      .map((id) => nodeMap.get(id))
      .filter((node) => node && node.level === 'tag')
  }

  const craftPunchlines = (nodeId) => {
    const node = nodeMap.get(nodeId)
    if (!node) return []
    const tags = linkedTagsFor(nodeId)
    const tagLabels = tags.map((tag) => tag.label)
    const main = node.label || node.id
    const emoji = node.emoji || '✨'

    const lines = [
      `${emoji} ${main} respire : ${tagLabels.slice(0, 2).join(' · ') || 'un motif discret'}.`,
      `${emoji} ${main} ouvre une porte vers ${tagLabels[0] || 'un nouvel écho'}.`,
      `${emoji} ${main} murmure « ${tagLabels.slice(0, 3).join(', ') || 'une image encore floue'} ».`,
    ]

    return lines
  }

  const craftComboPunchlines = (ids) => {
    if (!ids.length) return []
    const nodes = ids
      .map((id) => nodeMap.get(id))
      .filter(Boolean)
      .map((node) => ({ label: node.label || node.id, emoji: node.emoji || '✨', level: node.level }))

    if (!nodes.length) return []

    const labelList = nodes.map((n) => `${n.emoji} ${n.label}`).join(' + ')
    const tagCloud = ids
      .flatMap((id) => linkedTagsFor(id))
      .slice(0, 4)
      .map((t) => t.label)
      .join(' · ')

    return [
      `${labelList} croisent leurs ondes : ${tagCloud || 'un maillage discret'}.`,
      `${labelList} tissent une punchline nouvelle qui scintille.`,
    ]
  }

  const handleEmojiTap = (node) => {
    setSuggestions(craftPunchlines(node.id))
    setComboEcho('')
  }

  const handleSelectionChange = (ids, resonanceText) => {
    if (!ids.length) {
      setComboEcho('')
      return
    }
    const comboLines = craftComboPunchlines(ids)
    const merged = resonanceText ? [resonanceText, ...comboLines] : comboLines
    setComboEcho(merged.join('\n'))
    setSuggestions(merged)
  }

  const togglePunchline = (line) => {
    setSelectedPunchlines((prev) => {
      if (prev.includes(line)) return prev.filter((item) => item !== line)
      if (prev.length >= 5) return prev
      return [...prev, line]
    })
  }

  const promptPreview = useMemo(() => {
    if (!selectedPunchlines.length) return ''
    const emojiThemes = morphosis.graphNodes
      .filter((node) => node.level === 'metaphor')
      .map((node) => `${node.emoji || '🪨'} ${node.label}`)
      .join(', ')

    return [
      '🎛️ Brief Nebius — ÉchoBulles · Metaphoria',
      `Contexte utilisateur : ${sourceText}`,
      `Emojis/thèmes clés : ${emojiThemes || 'motifs en attente'}`,
      'Punchlines retenues :',
      ...selectedPunchlines.map((line) => `- ${line}`),
      'Demande : composer une histoire métaphorique courte et une image poétique.',
    ].join('\n')
  }, [selectedPunchlines, morphosis.graphNodes, sourceText])

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
            onNodeTap={handleEmojiTap}
            onSelectionChange={handleSelectionChange}
          />
          {murmur && (
            <div className="murmur" role="status" aria-live="polite">
              {murmur}
            </div>
          )}
        </div>
      </div>

      <div className="coach-panel">
        <div className="coach-block">
          <p className="coach-title">Punchlines suggérées</p>
          {comboEcho && <p className="micro-hint">Fusion {comboEcho}</p>}
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
            {!suggestions.length && <p className="micro-hint">Tapote un emoji pour inspirer une phrase.</p>}
          </div>
        </div>

        <div className="coach-block">
          <p className="coach-title">Punchlines retenues ({selectedPunchlines.length}/5)</p>
          <ul className="kept-list">
            {selectedPunchlines.map((line) => (
              <li key={line}>
                <button type="button" onClick={() => togglePunchline(line)} className="chip chip-active">
                  {line} ✕
                </button>
              </li>
            ))}
            {!selectedPunchlines.length && <li className="micro-hint">Choisis jusqu’à 5 éclats.</li>}
          </ul>
        </div>

        <div className="coach-block">
          <p className="coach-title">Brief Nebius prêt</p>
          <textarea readOnly value={promptPreview} placeholder="Les punchlines sélectionnées forment le brief." />
          <p className="micro-hint">Copie ce texte pour générer l’histoire et l’image ÉchoBulles.</p>
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
