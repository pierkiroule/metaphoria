import React, { useMemo, useState } from 'react';
import BubbleInput from './components/BubbleInput.jsx';
import EchoPanel from './components/EchoPanel.jsx';
import Constellation from './components/Constellation.jsx';
import echoesData from './data/echoesreso.json';
import { extractKeywords } from './logic/keywords.js';
import { computeResonance, getHistory } from './logic/resonance.js';

export default function App() {
  const [mode, setMode] = useState('input');
  const [currentEchoes, setCurrentEchoes] = useState([]);
  const [activeTags, setActiveTags] = useState([]);

  const history = useMemo(() => getHistory(), [mode, currentEchoes]);
  const totalTags = useMemo(() => {
    const set = new Set();
    echoesData.forEach((echo) => echo.tags.forEach((tag) => set.add(tag)));
    return set.size;
  }, []);
  const heroSignal = history[0]?.keywords.join(' • ') || 'Prêt à tisser un nouvel écho';

  const handleLaunch = (text) => {
    const keywords = extractKeywords(text);
    const { selected, activeTags: tags } = computeResonance(keywords, echoesData);
    setCurrentEchoes(selected);
    setActiveTags(tags);
    setMode('echo');
  };

  const reset = () => {
    setMode('input');
    setCurrentEchoes([]);
    setActiveTags([]);
  };

  return (
    <main className="app">
      <div className="stars" aria-hidden />
      <header className="hero">
        <div className="hero__copy">
          <span className="pill">Nouvelle page d&apos;accueil</span>
          <h1>Echo from Metaphoria</h1>
          <p className="hero__lede">
            Dépose tes mots, lance une bulle et observe la cartographie poétique qui en
            découle. Tout est en temps réel, tout est relié.
          </p>
          <div className="hero__actions">
            <span className="glass-tag">Lance ta bulle</span>
            <span className="glass-tag">{echoesData.length} échos à explorer</span>
            <span className="glass-tag">{totalTags} tags interconnectés</span>
          </div>
        </div>
        <div className="hero__card">
          <p className="card-kicker">Signal en direct</p>
          <h3>{heroSignal}</h3>
          <p className="muted">Chaque bulle nourrit la constellation. Sélectionne les mots qui résonnent.</p>
          <div className="stat-grid">
            <div className="stat">
              <strong>{history.length}</strong>
              <span>traces archivées</span>
            </div>
            <div className="stat">
              <strong>{echoesData.length}</strong>
              <span>échos disponibles</span>
            </div>
            <div className="stat">
              <strong>{totalTags}</strong>
              <span>constellations actives</span>
            </div>
          </div>
        </div>
      </header>

      {mode === 'input' && (
        <section className="stage stage-grid">
          <div className="stage-panel">
            <BubbleInput onLaunch={handleLaunch} />
            <p className="stage-helper">Glisse vers le haut pour faire voyager tes mots.</p>
          </div>
          <div className="history">
            <div className="history__header">
              <div>
                <p className="pill pill--ghost">Flux récent</p>
                <h3>Dernières traces</h3>
              </div>
              <span className="muted">{history.length} enregistrements</span>
            </div>
            {history.length === 0 && <p className="muted">Rien encore. Laisse ton premier écho.</p>}
            <ul className="timeline">
              {history.slice(0, 5).map((item) => (
                <li key={item.timestamp}>
                  <div className="dot" aria-hidden />
                  <div>
                    <p className="timestamp">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="muted keywords">{item.keywords.join(' · ') || '...'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {mode === 'echo' && (
        <section className="echo-stage">
          <Constellation keywords={activeTags} echoes={currentEchoes} />
          <EchoPanel echoes={currentEchoes} onReset={reset} />
        </section>
      )}
    </main>
  );
}
