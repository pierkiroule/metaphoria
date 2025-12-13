import { useMemo, useState } from 'react'
import './App.css'

const baseWords = ['brume', 'souffle', 'nuit', 'reflet']

function App() {
  const [input, setInput] = useState('éclat\npierre\nrespiration')
  const [words, setWords] = useState(baseWords)
  const [status, setStatus] = useState('idle')
  const [highlighted, setHighlighted] = useState([])

  const echoedPrompt = useMemo(
    () =>
      `Entre ${words.slice(0, 3).join(', ')} et ${words[words.length - 1]}, cherche une vibration douce, presque silencieuse.`,
    [words],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!input.trim()) return

    const incomingWords = input
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean)

    if (!incomingWords.length) return

    setWords((previous) => [...previous, ...incomingWords])
    setHighlighted(incomingWords)
    setStatus('sent')
    setInput('')

    setTimeout(() => setStatus('idle'), 1200)
    setTimeout(() => setHighlighted([]), 1800)
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
          <h1>Résonance locale, lente et lumineuse</h1>
          <p className="lede">
            Dépose des mots, observe leur souffle commun, puis laisse émerger un écho symbolique. Rien ne presse :
            l&apos;interface respire avec toi.
          </p>
        </header>

        <section className="panel bubble-panel" aria-label="Dépôt de mots">
          <div className={`word-bubble ${status === 'sent' ? 'bubble-sent' : ''}`}>
            <div className="bubble-inner">
              <div className="bubble-header">
                <span className="bubble-dot" aria-hidden />
                <p className="bubble-title">Dépose les mots ici</p>
              </div>
              <form className="bubble-form" onSubmit={handleSubmit}>
                <label className="visually-hidden" htmlFor="words">
                  Mots à déposer
                </label>
                <textarea
                  id="words"
                  name="words"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="brume, souffle, nuit..."
                  rows={3}
                />
                <div className="bubble-actions">
                  <button type="submit" className="ghost-button">
                    Envoyer
                  </button>
                  <p className="bubble-whisper">Swipe ou clic : la bulle s&apos;élève doucement.</p>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="panel resonance" aria-label="Résonance locale">
          <div className="panel-header">
            <p className="eyebrow">Résonance locale</p>
            <h2>Les mots deviennent des points lumineux</h2>
            <p className="hint">Les liens apparaissent quand ils veulent. Sinon, ils restent en suspension.</p>
          </div>
          <div className="resonance-cloud" role="list">
            {words.map((word, index) => {
              const isNew = highlighted.includes(word)
              const delay = (index % 5) * 40
              return (
                <span
                  key={`${word}-${index}`}
                  className={`glow-point ${isNew ? 'fresh' : ''}`}
                  style={{ animationDelay: `${delay}ms` }}
                  role="listitem"
                >
                  {word}
                </span>
              )
            })}
          </div>
          <div className="silence-state" aria-hidden>
            <span className="silence-dot" />
            <p>Silence bienveillant. Les points attendent leur prochain écho.</p>
          </div>
        </section>

        <section className="panel prompt" aria-label="Carte d&apos;écho symbolique">
          <div className="panel-header">
            <p className="eyebrow">Écho généré</p>
            <h2>Carte flottante</h2>
            <p className="hint">Mots sources, résonance et usage sont rassemblés ici.</p>
          </div>
          <div className="prompt-card" role="article">
            <div className="prompt-section">
              <p className="section-label">Mots sources</p>
              <div className="chip-row">
                {words.slice(-6).map((word, index) => (
                  <span key={`${word}-${index}`} className="chip">
                    {word}
                  </span>
                ))}
              </div>
            </div>
            <div className="prompt-section">
              <p className="section-label">Écho symbolique</p>
              <p className="prompt-text">{echoedPrompt}</p>
            </div>
            <div className="prompt-section prompt-actions">
              <div>
                <p className="section-label">Style / Usage</p>
                <p className="prompt-text">Cosmico-poétique, discret, prêt pour une médiation ou un atelier.</p>
              </div>
              <button type="button" className="primary-button">
                Activer l&apos;IA cloud
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
