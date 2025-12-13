import React, { useEffect, useState } from 'react';

const FAVORITES_KEY = 'metaphoria-favorites';

function loadFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

export default function EchoPanel({ echoes, onReset }) {
  const [selected, setSelected] = useState(() => loadFavorites());

  useEffect(() => {
    saveFavorites(selected);
  }, [selected]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  return (
    <div className="echo-panel">
      <div className="panel-header">
        <h2>ECHORESO</h2>
        <button className="ghost" type="button" onClick={onReset}>Recommencer</button>
      </div>
      <div className="echo-grid">
        {echoes.map((echo) => (
          <button
            key={echo.id}
            type="button"
            className={`echo-card ${selected.includes(echo.id) ? 'selected' : ''}`}
            onClick={() => toggle(echo.id)}
          >
            <div className="echo-tone">{echo.tone}</div>
            <p>{echo.text}</p>
            <div className="echo-tags">{echo.tags.join(' • ')}</div>
            <div className="echo-star" aria-hidden>{selected.includes(echo.id) ? '⭐' : '☆'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
