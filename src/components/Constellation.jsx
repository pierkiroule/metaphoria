import React, { useMemo } from 'react';

function toSeed(text) {
  return (text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export default function Constellation({ keywords, echoes }) {
  const seed = useMemo(() => toSeed(keywords.join('-') || 'constellation'), [keywords]);
  const rand = useMemo(() => seededRandom(seed), [seed]);

  const nodes = useMemo(() => {
    const tagSet = new Set(keywords);
    echoes.forEach((echo) => echo.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).map((id) => ({ id, x: rand() * 100, y: rand() * 100 }));
  }, [keywords, echoes, rand]);

  const links = useMemo(() => {
    const pairs = [];
    const seen = new Set();
    echoes.forEach((echo) => {
      for (let i = 0; i < echo.tags.length; i += 1) {
        for (let j = i + 1; j < echo.tags.length; j += 1) {
          const a = echo.tags[i];
          const b = echo.tags[j];
          const key = [a, b].sort().join('-');
          if (seen.has(key)) continue;
          seen.add(key);
          pairs.push({ from: a, to: b });
        }
      }
    });
    return pairs;
  }, [echoes]);

  return (
    <div className="constellation">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Constellation des mots">
        <g className="edges">
          {links.map((link) => {
            const from = nodes.find((n) => n.id === link.from);
            const to = nodes.find((n) => n.id === link.to);
            if (!from || !to) return null;
            return (
              <line
                key={`${link.from}-${link.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={0.2}
              />
            );
          })}
        </g>
        <g className="nodes">
          {nodes.map((node, index) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={keywords.includes(node.id) ? 2.2 : 1.5}
              className={index % 2 === 0 ? 'pulse' : 'glow'}
            >
              <title>{node.id}</title>
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
}
