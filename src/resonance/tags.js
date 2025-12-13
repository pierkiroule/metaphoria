const TAG_MAP = {
  eau: { tags: ['fluidité', 'intuition'], emoji: '🌊' },
  feu: { tags: ['impulsion', 'créativité'], emoji: '🔥' },
  terre: { tags: ['ancrage', 'stabilité'], emoji: '🌍' },
  air: { tags: ['liens', 'communication'], emoji: '🌬️' },
  ombre: { tags: ['protection', 'gestation'], emoji: '🌑' },
  forêt: { tags: ['refuge', 'quête'], emoji: '🌲' },
  roche: { tags: ['solidité', 'patience'], emoji: '🪨' },
}

export function tagFromToken(token) {
  return TAG_MAP[token] ?? { tags: ['ouverture'], emoji: '✨' }
}

export function collectTags(tokens) {
  const collected = tokens.flatMap((token) => tagFromToken(token).tags)
  return Array.from(new Set(collected))
}

export function dominantEmoji(tokens) {
  if (!tokens.length) return '🌀'
  const preferred = tokens
    .map((token) => tagFromToken(token).emoji)
    .find((value) => value && value !== '✨')
  return preferred ?? '✨'
}
