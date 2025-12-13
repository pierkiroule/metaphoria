import React, { useRef, useState } from 'react';

const SWIPE_THRESHOLD = 80;

export default function BubbleInput({ onLaunch }) {
  const [text, setText] = useState('');
  const [animating, setAnimating] = useState(false);
  const [hint, setHint] = useState('Swipe up');
  const startY = useRef(null);
  const lastY = useRef(null);

  const resetTouch = () => {
    startY.current = null;
    lastY.current = null;
  };

  const handleTouchStart = (e) => {
    if (animating) return;
    startY.current = e.touches[0].clientY;
    lastY.current = startY.current;
  };

  const handleTouchMove = (e) => {
    if (animating || startY.current === null) return;
    lastY.current = e.touches[0].clientY;
    const delta = startY.current - lastY.current;
    if (delta > SWIPE_THRESHOLD / 2) {
      setHint('Encore un peu...');
    } else {
      setHint('Swipe up');
    }
  };

  const handleTouchEnd = () => {
    if (animating || startY.current === null || lastY.current === null) {
      resetTouch();
      return;
    }
    const delta = startY.current - lastY.current;
    if (delta > SWIPE_THRESHOLD && text.trim()) {
      setAnimating(true);
      setHint('Envol...');
      setTimeout(() => {
        onLaunch(text.trim());
        setText('');
        setAnimating(false);
        setHint('Swipe up');
      }, 600);
    } else {
      setHint('Swipe up');
    }
    resetTouch();
  };

  return (
    <div className="bubble-wrapper">
      <div
        className={`bubble ${animating ? 'launch' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <input
          type="text"
          value={text}
          placeholder="Dépose tes mots ici"
          onChange={(e) => setText(e.target.value)}
          disabled={animating}
          aria-label="Saisir des mots"
        />
        <span className="bubble-hint">{hint}</span>
      </div>
    </div>
  );
}
