import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { EchoGraphFlow } from './components/EchoGraphFlow'
import { generateResonantMorphosis } from './resonantMorphosis'

const DEVICE_WIDTH = 390
const DEVICE_HEIGHT = 844

const baseStyles = ['cosmico-poétique', 'contemplatif']
const baseUsages = ['atelier', 'médiation']

function App() {
  const [theme, setTheme] = useState('dark')
  const [sourceDraft, setSourceDraft] = useState('Je suis fatigué, tout me semble lourd et je n’avance plus.')
  const [sourceText, setSourceText] = useState('Je suis fatigué, tout me semble lourd et je n’avance plus.')
  const [activeNode, setActiveNode] = useState(null)
  const [selectedNodes, setSelectedNodes] = useState([])
  const [stage, setStage] = useState('home')
  const [pairEcho, setPairEcho] = useState('')
  const [cloudOn, setCloudOn] = useState(false)
  const [styleChoice, setStyleChoice] = useState(baseStyles[0])
  const [usageChoice, setUsageChoice] = useState(baseUsages[0])

  const morphosis = useMemo(() => generateResonantMorphosis(sourceText), [sourceText])

  useEffect(() => {
    setSelectedNodes([])
    setActiveNode(null)
    setPairEcho('')
    setStage((current) => (current === 'home' ? 'home' : 'graph'))
  }, [sourceText])

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

  useEffect(() => {
    setSelectedNodes((current) => current.filter((node) => graphNodes.some((item) => item.id === node.id)))
  }, [graphNodes])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!sourceDraft.trim()) return
    setSourceText(sourceDraft)
    setStage('graph')
    setActiveNode(null)
    setSelectedNodes([])
    setPairEcho('')
  }

  const handleFocusNode = (node) => {
    setActiveNode(node)
    if (node) setStage('focus')
  }

  const handleSelectionChange = (items) => {
    setSelectedNodes(items)
    if (items.length) {
      setActiveNode(items[items.length - 1])
      setStage('focus')
    }
  }

  const toggleSelection = (node) => {
    if (!node) return
    setSelectedNodes((current) => {
      const exists = current.some((item) => item.id === node.id)
      const updated = exists ? current.filter((item) => item.id !== node.id) : [...current, node].slice(-2)
      if (updated.length) {
        setActiveNode(updated[updated.length - 1])
        setStage('focus')
      }
      return updated
    })
  }

  const handleGenerateEcho = (pair = selectedNodes) => {
    if (!pair || pair.length < 2) return
    const [a, b] = pair
    const combined = `Entre ${a.label} et ${b.label}, un fil discret se tend, prêt à porter un nouvel écho.`
    setPairEcho(combined)
    setStage('prompt')
  }

  const handleStart = () => {
    setStage('graph')
  }

  const toggleCloud = () => {
    setCloudOn((prev) => !prev)
  }

  return (
    <div className={`app-root theme-${theme}`}>
      <div className="frame-shadow">
        <div className="device-frame" style={{ width: DEVICE_WIDTH, height: DEVICE_HEIGHT }}>
          <div className="frame-notch" aria-hidden />
          <div className="status-bar" aria-label="Statut iPhone">
            <span className="status-time">09:41</span>
            <div className="status-icons" aria-hidden>
              <i className="fa-solid fa-signal" />
              <i className="fa-solid fa-wifi" />
              <i className="fa-solid fa-battery-full" />
            </div>
          </div>

          <div className="device-screen" role="main" aria-label="Echo mobile UI">
            <div className="banner" style={{ width: DEVICE_WIDTH }}>
              <div className="banner-bg" />
              <h1 className="banner-title">✨ ECHO ✨</h1>
              <button
                type="button"
                className="mode-toggle"
                aria-label="Basculer le thème"
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              >
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
                <span>{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</span>
              </button>
            </div>

            <div className="bubble-area" style={{ width: DEVICE_WIDTH }}>
              <form className={`input-bubble ${stage !== 'home' ? 'bubble-hidden' : ''}`} onSubmit={handleSubmit}>
                <label className="visually-hidden" htmlFor="sourceText">Dépose tes mots</label>
                <i className="fa-solid fa-paper-plane" aria-hidden />
                <input
                  id="sourceText"
                  name="sourceText"
                  value={sourceDraft}
                  onChange={(event) => setSourceDraft(event.target.value)}
                  placeholder="Dépose tes mots ici"
                  onFocus={handleStart}
                  onClick={handleStart}
                />
                <button type="submit" className="submit-bubble">Résonner</button>
              </form>
              <p className="bubble-hint">(tap pour écrire)</p>

              <div className={`bubble-fragments ${stage === 'graph' ? 'visible' : ''}`} aria-hidden>
                {['écho', 'champ', 'mot', 'tag', 'flux', 'ombre'].map((word, index) => (
                  <span key={word} className={`fragment fragment-${index}`}>
                    <i className="fa-solid fa-hashtag" aria-hidden /> {word}
                  </span>
                ))}
                <div className="fragment-lines" />
              </div>
            </div>

            <div className={`graph-zone ${stage === 'home' ? 'hidden' : ''}`} style={{ width: DEVICE_WIDTH }}>
              <div className="graph-cluster" aria-label="Zone graphique">
                <EchoGraphFlow
                  nodes={graphNodes}
                  links={graphLinks}
                  selectedIds={selectedNodes.map((node) => node.id)}
                  onFocusNode={handleFocusNode}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
              <div className="graph-overlay-ui">
                <span className="graph-pill">Tap = focus · Double tap = sélectionner · Pinch = zoom</span>
                <button type="button" className="gear-btn" onClick={() => setStage('prompt')} aria-label="Ouvrir la carte d’écho">
                  <i className="fa-solid fa-gear" />
                </button>
              </div>
            </div>

            <div className={`echo-panel ${stage !== 'home' ? 'visible' : ''}`} style={{ width: DEVICE_WIDTH }}>
              <div className="panel-handle" aria-hidden />
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">{activeNode ? activeNode.type : 'Carte d’écho'}</p>
                  <p className="panel-title">
                    {activeNode
                      ? `${activeNode.emoji || '⟡'} ${activeNode.label}`
                      : 'Focus sur un nœud pour révéler son souffle'}
                  </p>
                </div>
                <div className="panel-actions">
                  <button type="button" className="pill-btn" onClick={() => setStage('graph')}>
                    <i className="fa-solid fa-circle-nodes" /> Graphe
                  </button>
                  <button type="button" className="pill-btn ghost" onClick={() => setStage('prompt')}>
                    <i className="fa-solid fa-wand-magic-sparkles" /> Prompt
                  </button>
                </div>
              </div>

              {activeNode && (
                <div className="panel-highlight">
                  <p className="panel-emoji">{activeNode.emoji || '⟡'}</p>
                  <div>
                    <p className="panel-highlight-title">{activeNode.label}</p>
                    <p className="panel-subline">Type : {activeNode.type}</p>
                  </div>
                </div>
              )}

              {['metaphor', 'echo'].includes(activeNode?.type) && (
                <div className="panel-tags">
                  <p className="field-label">Tags / punchlines</p>
                  <div className="tag-row">
                    {morphosis.resonantTags.map((tag) => (
                      <span key={tag} className="mini-chip">
                        #{tag}
                      </span>
                    ))}
                    {!morphosis.resonantTags.length && <span className="mini-chip muted">En attente</span>}
                  </div>
                </div>
              )}

              <div className="panel-controls">
                <div className="chip-row">
                  {baseStyles.map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`chip ${styleChoice === style ? 'active' : ''}`}
                      onClick={() => setStyleChoice(style)}
                    >
                      <span>⟡</span> {style}
                    </button>
                  ))}
                </div>
                <div className="chip-row">
                  {baseUsages.map((usage) => (
                    <button
                      key={usage}
                      type="button"
                      className={`chip ${usageChoice === usage ? 'active' : ''}`}
                      onClick={() => setUsageChoice(usage)}
                    >
                      <span>⇄</span> {usage}
                    </button>
                  ))}
                </div>
                <div className="cloud-row">
                  <div className="switch" role="switch" aria-checked={cloudOn} tabIndex={0} onClick={toggleCloud}>
                    <div className={`thumb ${cloudOn ? 'on' : ''}`} />
                  </div>
                  <p className="switch-label">IA cloud {cloudOn ? 'ON' : 'OFF'}</p>
                  <i className={`fa-solid fa-cloud ${cloudOn ? 'pulse' : ''}`} aria-hidden />
                  <p className="cloud-message">{cloudOn ? 'Amplifier l’écho' : 'Local · rien transmis'}</p>
                </div>
              </div>

              <div className="selection-row">
                <button
                  type="button"
                  className="pill-btn"
                  disabled={!activeNode}
                  onClick={() => toggleSelection(activeNode)}
                >
                  {selectedNodes.some((item) => item.id === activeNode?.id) ? 'Retirer' : 'Sélectionner'}
                </button>
                <button
                  type="button"
                  className="pill-btn solid"
                  disabled={selectedNodes.length !== 2}
                  onClick={() => handleGenerateEcho(selectedNodes)}
                >
                  Générer un nouvel écho
                </button>
              </div>

              <div className={`prompt-sheet ${stage === 'prompt' ? 'open' : ''}`}>
                <div className="prompt-grid">
                  <div className="prompt-field">
                    <p className="field-label">Mots</p>
                    <p className="field-value">{sourceText.slice(0, 40)}...</p>
                  </div>
                  <div className="prompt-field">
                    <p className="field-label">Champ</p>
                    <p className="field-value">{morphosis.dominantMetaphoricField}</p>
                  </div>
                  <div className="prompt-field">
                    <p className="field-label">Style</p>
                    <p className="field-value">{styleChoice}</p>
                  </div>
                  <div className="prompt-field">
                    <p className="field-label">Usage</p>
                    <p className="field-value">{usageChoice}</p>
                  </div>
                </div>
                <div className="prompt-body">
                  <p className="field-label">Prompt généré</p>
                  <p className="prompt-text">{pairEcho || 'Sélectionne deux nœuds pour tisser un nouvel écho.'}</p>
                </div>
              </div>
            </div>

            <div className="silence-zone" style={{ width: DEVICE_WIDTH }}>
              <a href="#" className="silence-btn" onClick={() => setStage('silence')}>
                Silence
              </a>
              <div className={`silence-screen ${stage === 'silence' ? 'visible' : ''}`}>
                <div className="silence-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
                <p className="silence-copy">L’écho reste en attente.</p>
              </div>
            </div>

            <div className="home-indicator" aria-hidden />
          </div>
        </div>
      </div>
      <p className="resource-note">Use copyright-free resources like FontAwesome, Unsplash, Pexels, or similar services for image, font, and video placeholders.</p>
    </div>
  )
}

export default App
