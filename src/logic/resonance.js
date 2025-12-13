import echoesData from '../data/echoesreso.json';

const HISTORY_KEY = 'metaphoria-history';

function safeReadList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Unable to read local history', err);
    return [];
  }
}

function safeWriteList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Unable to persist history', err);
  }
}

function toSeed(text) {
  return (text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function stableShuffle(list, seed) {
  const rand = seededRandom(seed);
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function recordHistory(entry) {
  const existing = safeReadList(HISTORY_KEY);
  existing.unshift(entry);
  safeWriteList(HISTORY_KEY, existing.slice(0, 20));
}

export function getHistory() {
  return safeReadList(HISTORY_KEY);
}

export function computeResonance(keywords, dataset = echoesData) {
  const activeTags = keywords.map((k) => k.word);
  const scored = dataset.map((echo) => {
    const overlap = echo.tags.filter((tag) => activeTags.includes(tag)).length;
    return { ...echo, score: overlap };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));
  const seed = toSeed(activeTags.join('-') || 'echo');
  const pool = maxScore > 0
    ? scored.filter((s) => s.score === maxScore)
    : stableShuffle(scored, seed);

  const ordered = stableShuffle(pool, seed).sort((a, b) => b.intensity - a.intensity);
  const count = Math.min(5, Math.max(3, ordered.length));
  const selected = ordered.slice(0, count);

  const logEntry = {
    timestamp: Date.now(),
    keywords: activeTags,
    displayed: selected.map((s) => s.id),
    topScore: maxScore
  };
  recordHistory(logEntry);

  return { selected, activeTags, topScore: maxScore };
}
