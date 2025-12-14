import './App.css'
import EchoGraphD3 from './components/EchoGraphD3'

const emojiNodes = [
  {
    id: 'emoji-🫧',
    emoji: '🫧',
    count: 12,
    tags: ['transformation', 'fragilité', 'passage', 'lent'],
  },
  { id: 'emoji-🌫️', emoji: '🌫️', count: 7, tags: ['flou', 'lenteur', 'crépuscule'] },
  { id: 'emoji-🌱', emoji: '🌱', count: 5, tags: ['éveil', 'germer', 'départ'] },
  { id: 'emoji-✨', emoji: '✨', count: 3, tags: ['éclat', 'impulsion'] },
]

const emojiLinks = [
  { source: 'emoji-🫧', target: 'emoji-🌫️', weight: 7 },
  { source: 'emoji-🫧', target: 'emoji-🌱', weight: 3 },
  { source: 'emoji-🌫️', target: 'emoji-🌱', weight: 2 },
  { source: 'emoji-🫧', target: 'emoji-✨', weight: 2 },
]

function App() {
  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">EchoBulle</p>
          <h1>Cosmobulle</h1>
          <p className="lede">Les emojis donnent le ton. Les tags racontent les détails.</p>
        </div>
        <p className="hint">
          Les emojis montrent les tonalités. Les tags précisent les nuances. Zoome pour
          écouter plus finement.
        </p>
      </header>

      <main className="cosmobulle">
        <section className="graph-shell">
          <EchoGraphD3 emojiNodes={emojiNodes} emojiLinks={emojiLinks} />
          <div className="overlay-text">
            <p className="title">✨ EchoBulle</p>
            <p className="subtitle">Les métabulles vivent dans la cosmobulle.</p>
            <p className="micro">Tap : écouter · Double tap : relier · Pincer : zoomer.</p>
          </div>
        </section>

        <aside className="side-note">
          <p className="accent">🫧 Cosmobulle</p>
          <p className="body">
            Les emojis sont les pôles de résonance. Taille minimale : 44px pour des
            gestes sûrs. Leur taille reflète la présence. Les tags orbitent et
            apparaissent au tap ou en zoom profond.
          </p>
          <p className="body">
            Vue globale : emojis + liens. Vue focalisée : tags reliés. Une seule scène,
            sans menu. La poésie se lit dans le geste.
          </p>
          <div className="quote">
            <p>Les emojis donnent le ton. Les tags racontent les détails.</p>
          </div>
        </aside>
      </main>

      <footer className="footer">Semer des métabulles. Écouter ce qui résonne.</footer>
    </div>
  )
}

export default App
