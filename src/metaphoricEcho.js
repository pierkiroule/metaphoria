// Local metaphoric echo generator (no AI)
// Produces a dominant theme, emoji, tags, and short punchlines from user words.

const stopWords = new Set([
  'et', 'ou', 'de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'en', 'dans', 'sur', 'sous', 'avec',
  'que', 'qui', 'quoi', 'où', 'au', 'aux', 'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'son', 'sa', 'ses', 'leur', 'leurs', 'pour', 'par', 'pas', 'ne', 'plus', 'je', 'tu', 'il', 'elle', 'on', 'nous',
  'vous', 'ils', 'elles', 'y', 'a', 'd', 'l', "l'", "d'",
])

const domains = [
  {
    id: 'water',
    emoji: '💧',
    themes: ['courant sous la peau', 'pression intérieure', 'éclat liquide', 'flux de brume'],
    tags: ['flux', 'marée', 'dissolution', 'bulle'],
    keywords: ['vague', 'marée', 'flot', 'flux', 'bulle', 'pluie', 'averse', 'courant', 'mouillé', 'noy', 'immer', 'larmes'],
    punchlines: [
      'Comme une bulle trop pleine qui tremble sans éclater.',
      'Une marée discrète cherche la faille pour passer.',
      'La surface tient, mais le dessous se soulève lentement.',
      "Un ruissellement intérieur attend une sortie douce.",
      "La pression s'arrondit, presque prête à se répandre.",
    ],
  },
  {
    id: 'air',
    emoji: '🫧',
    themes: ['souffle contenu', 'pression aérienne', 'silence suspendu', 'vide vibrant'],
    tags: ['respiration', 'étreinte', 'lévitation', 'retenue'],
    keywords: ['souffle', 'air', 'respir', 'pression', 'vide', 'aspirer', 'étouff', 'manque', 'poumon'],
    punchlines: [
      "Le souffle reste accroché, comme retenu par un altocumulus intérieur.",
      'Une poche de silence gonfle sans se décider.',
      'Les mots se tiennent en apnée, flottant entre deux battements.',
      'Un courant léger passe, mais quelque chose fait barrage.',
      "La pièce est pleine d'air, pourtant le thorax murmure son manque.",
    ],
  },
  {
    id: 'fire',
    emoji: '🔥',
    themes: ['tension brûlante', 'incandescence contenue', 'braise sous la peau'],
    tags: ['incendie calme', 'excès', 'braise', 'fissure'],
    keywords: ['brûl', 'feu', 'fièvre', 'ardeur', 'colère', 'rage', 'tension', 'crisp', 'impulsion'],
    punchlines: [
      'Une braise tient, étouffée, mais la chaleur cherche sa faille.',
      'Les nerfs scintillent comme des filaments rouges sous verre.',
      'Un éclat incendiaire pulse sans se dire, lumière contenue.',
      'Des étincelles roulent sous la langue, sans étouffer la nuit.',
      "Ça chauffe en sourdine, comme une forge qui retient le marteau.",
    ],
  },
  {
    id: 'earth',
    emoji: '🪨',
    themes: ['gravité douce', 'ancrage lourd', 'terrassement intérieur'],
    tags: ['lourdeur', 'ancrage', 'inertie', 'strates'],
    keywords: ['lourd', 'roche', 'pierre', 'sol', 'terre', 'ancré', 'bloc', 'plomb', 'inerte', 'fatigue'],
    punchlines: [
      'Une masse immobile retient le geste, solide comme une dalle froide.',
      "Le corps se cale contre une paroi, cherchant où s'appuyer.",
      "Des strates s'empilent, gardiennes d'un repos malgré tout.",
      'Une lourdeur minérale étale son silence rassurant.',
      'La marche se fait lente, chaque pas creuse une empreinte molle.',
    ],
  },
  {
    id: 'shadow',
    emoji: '🌘',
    themes: ['retranchement doux', 'ombre fertile', 'silence gardé'],
    tags: ['repli', 'secret', 'gestation', 'clair-obscur'],
    keywords: ['ombre', 'noir', 'silence', 'retrait', 'caché', 'secret', 'nuit', 'discret', 'absence', 'retenue'],
    punchlines: [
      "Un pli d'ombre se referme doucement pour garder la chaleur.",
      'Tout reste en demi-teinte, comme si la scène attendait la lumière.',
      'Des formes passent derrière le rideau, sans se nommer.',
      "Le murmure s'enroule dans un coin, gardien d'un possible.",
      'La pièce assourdit les sons, mais le velours porte encore une trace.',
    ],
  },
]

const fallbackEcho = {
  theme: 'Écho discret',
  emoji: '…',
  tags: ['silence', 'pause', 'écoute'],
  punchlines: ["L'écho reste discret. Rien n'insiste pour l'instant."],
}

function hashSeed(tokens) {
  return tokens.join('-').split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 7)
}

function tokenize(words) {
  return words
    .flatMap((entry) => entry.split(/[^\p{L}\p{N}]+/u))
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token && !stopWords.has(token))
}

function scoreDomains(tokens) {
  return domains.map((domain) => {
    const keywordScore = tokens.reduce((score, token) => {
      const matched = domain.keywords.some((keyword) => token.includes(keyword) || keyword.includes(token))
      return matched ? score + 2 : score
    }, 0)

    const tonalScore = tokens.reduce((score, token) => {
      if (['fatigue', 'épuis', 'stress', 'tendu', 'pression', 'ango', 'anxi'].some((hint) => token.includes(hint))) {
        return score + 1
      }
      return score
    }, 0)

    return { id: domain.id, score: keywordScore + tonalScore }
  })
}

function pickItems(list, seed, count) {
  if (!list.length) return []
  const results = []
  let cursor = seed
  while (results.length < count) {
    const next = list[Math.abs(cursor) % list.length]
    if (!results.includes(next)) {
      results.push(next)
    }
    cursor += 3
  }
  return results
}

function buildTags(domain, tokens, seed) {
  const frequency = tokens.reduce((map, token) => {
    map.set(token, (map.get(token) || 0) + 1)
    return map
  }, new Map())

  const topTokens = Array.from(frequency.entries())
    .filter(([token]) => token.length > 3)
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)

  const combined = [...topTokens, ...domain.tags]
  const unique = combined.filter((token, index) => combined.indexOf(token) === index)
  return pickItems(unique, seed, 3)
}

function generateMetaphoricEcho(words) {
  const tokens = tokenize(words)
  if (!tokens.length) return fallbackEcho

  const scores = scoreDomains(tokens)
  const dominant = scores.sort((a, b) => b.score - a.score)[0]
  if (!dominant || dominant.score === 0) return fallbackEcho

  const domain = domains.find((item) => item.id === dominant.id)
  const seed = hashSeed(tokens)

  const theme = pickItems(domain.themes, seed, 1)[0]
  const tags = buildTags(domain, tokens, seed + 11)
  const punchlines = pickItems(domain.punchlines, seed + 23, 3)

  return { theme, emoji: domain.emoji, tags, punchlines }
}

export { generateMetaphoricEcho }
