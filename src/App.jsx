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
      <header>
        <h1>Echo from Metaphoria</h1>
        <p>Dépose des mots, laisse la bulle s'envoler, observe les échos.</p>
      </header>

      {mode === 'input' && (
        <section className="stage">
          <BubbleInput onLaunch={handleLaunch} />
          <div className="history">
            <h3>Dernières traces</h3>
            {history.length === 0 && <p className="muted">Rien encore. Laisse ton premier écho.</p>}
            {history.slice(0, 5).map((item) => (
              <p key={item.timestamp} className="muted">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {item.keywords.join(', ') || '...'}
              </p>
            ))}
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
