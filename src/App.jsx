import { useMemo, useState } from 'react'
import './App.css'
import { EchoGraph } from './EchoGraph'
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
  const [stage, setStage] = useState('home')
  const [pairEcho, setPairEcho] = useState('')
  const [cloudOn, setCloudOn] = useState(false)

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
    setStage('graph')
  }

  const handleGenerateEcho = (pair) => {
    if (pair.length < 2) return
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
                <EchoGraph
                  nodes={graphNodes}
                  links={graphLinks}
                  onSelectNode={(node) => {
                    setActiveNode(node)
                    setStage('focus')
                  }}
                  onGenerateEcho={handleGenerateEcho}
                />
              </div>
              <div className="graph-overlay-ui">
                <span className="graph-pill">Tap = focus · Tap long = sélectionner · Pinch = zoom</span>
                <a href="#" className="gear-btn" onClick={() => setStage('prompt')}>
                  <i className="fa-solid fa-gear" />
                </a>
              </div>
            </div>

            <div className={`focus-card ${stage === 'focus' ? 'visible' : ''}`} style={{ width: DEVICE_WIDTH - 28 }}>
              <div className="focus-icon" aria-hidden>
                <i className="fa-solid fa-circle-nodes" />
              </div>
              <div className="focus-copy">
                <p className="focus-title">🌫️ OMBRE / RETRAIT</p>
                <p className="focus-quote">
                  {activeNode ? `${activeNode.emoji || '⟡'} ${activeNode.label}` : 'Tap un nœud pour révéler son souffle.'}
                </p>
                <button type="button" className="echo-card-btn" onClick={() => setStage('prompt')}>
                  Carte d’écho
                </button>
              </div>
            </div>

            <div className={`prompt-panel ${stage === 'prompt' ? 'visible' : ''}`} style={{ width: DEVICE_WIDTH }}>
              <div className="prompt-header">
                <h2>Prompt prêt (local)</h2>
                <a href="#" className="close-link" onClick={() => setStage('graph')}>
                  Fermer
                </a>
              </div>
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
                  <p className="field-value">cosmico-poétique</p>
                </div>
                <div className="prompt-field">
                  <p className="field-label">Usage</p>
                  <p className="field-value">atelier / médiation</p>
                </div>
              </div>
              <div className="prompt-body">
                <p className="field-label">Prompt généré</p>
                <p className="prompt-text">{pairEcho || 'Sélectionne deux nœuds pour tisser un nouvel écho.'}</p>
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
