// src/resonantMorphosis.js

// --- STOP WORDS ---
const stopWords = new Set([
  'et','ou','de','des','du','la','le','les','un','une','en','dans','sur','sous','avec',
  'que','qui','quoi','où','au','aux','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes',
  'son','sa','ses','leur','leurs','pour','par','pas','ne','plus','je','tu','il','elle','on','nous',
  'vous','ils','elles','y','a','d','l',"l'","d'",
])

// Tokens that often pollute the flow or carry little meaning in this context.
const weakParticles = new Set([
  'me','m','moi','te','t','toi','se','s','suis','es','est','sommes','etes','êtes','sont',
  'sera','serai','serait','serons','seraient','être','etais','étais','étaient','n','j','qu',
])

const nodeStyles = {
  word: { color: '#94a3b8', orbit: 28, size: 10 },
  tag: { color: '#7c3aed', orbit: 40, size: 14 },
  metaphor: { color: '#f59e0b', orbit: 18, size: 18 },
  echo: { color: '#0ea5e9', orbit: 46, size: 12 },
}

// --- CHAMPS MÉTAPHORIQUES ---
const metaphoricFields = [
  {
    id: 'air',
    label: 'Souffle / Air',
    emoji: '🫧',
    keywords: ['souffle','respir','air','léger','vide','pression','étouff','apnée','manque'],
    verbs: ['gonfler','retenir','expirer','flotter'],
    tags: ['légèreté','retenue','suspension','souffle'],
    images: ['un souffle suspendu','une poche d’air','une respiration tenue'],
  },
  {
    id: 'water',
    label: 'Eau / Flux',
    emoji: '💧',
    keywords: ['vague','marée','flux','flot','courant','immer','pluie','ruisseau'],
    verbs: ['couler','submerger','ruisseler','diluer'],
    tags: ['flux','marée','dissolution','percolation'],
    images: ['un ruissellement intérieur','une bulle pleine','une marée discrète'],
  },
  {
    id: 'fire',
    label: 'Feu / Intensité',
    emoji: '🔥',
    keywords: ['brûl','feu','fièvre','ardeur','incand','colère','rage','tension'],
    verbs: ['brûler','chauffer','étinceler'],
    tags: ['incandescence','tension','braise','scintillement'],
    images: ['une braise sous la peau','un filament rouge','une chaleur contenue'],
  },
  {
    id: 'earth',
    label: 'Terre / Appui',
    emoji: '🪨',
    keywords: ['lourd','lourdeur','roche','pierre','sol','terre','ancrage','bloc','fatigue'],
    verbs: ['appuyer','porter','poser'],
    tags: ['appui','gravité','immobilité','ancrage'],
    images: ['un pas qui s’enfonce','une dalle froide','une gravité douce'],
  },
  {
    id: 'shadow',
    label: 'Ombre / Retrait',
    emoji: '🌘',
    keywords: ['ombre','noir','silence','retrait','secret','nuit','discret'],
    verbs: ['retenir','replier','envelopper'],
    tags: ['repli','secret','gestation','clair-obscur'],
    images: ['un pli d’ombre','un rideau entrouvert','une chaleur gardée'],
  },
  {
    id: 'light',
    label: 'Lumière / Apparition',
    emoji: '✨',
    keywords: ['lumière','clair','lueur','illum','révé','appara','étincelle'],
    verbs: ['éclairer','révéler','scintiller'],
    tags: ['éclat','révélation','scintillement'],
    images: ['une lueur basse','un reflet mince','un éclat discret'],
  },
]

// --- FALLBACK ---
const fallback = {
  sourceText: '',
  dominantMetaphoricField: 'Écho discret',
  emoji: '…',
  resonantTags: [
    { id: 'silence', label: 'silence', level: 'tag', strength: 0.4 },
    { id: 'pause', label: 'pause', level: 'tag', strength: 0.35 },
    { id: 'ecoute', label: 'écoute', level: 'tag', strength: 0.35 },
  ],
  metaphoricEchoes: ['L’écho reste discret. Rien n’insiste pour l’instant.'],
  graphNodes: [],
  graphLinks: [],
}

// --- OUTILS ---
function tokenize(text) {
  return text
    .split(/[^a-zA-Z0-9À-ÿ]+/)
    .map(t => t.toLowerCase().trim())
    .filter(Boolean)
}

function isVerb(token) {
  if (token.length <= 3) return false
  return ['er','ir','re','oir'].some(suffix => token.endsWith(suffix))
    || ['fait','fais','pous','tir','cherch','avance','crée','porte'].some(prefix => token.startsWith(prefix))
}

function analyzeTokens(text) {
  // Avoid Unicode property escapes (\p{L}) that can break parsing on older WebViews/Safari
  // by explicitly covering common latin ranges. This keeps the app from failing to load with
  // a blank screen on devices that don't support the more modern regex features.
  const rawTokens = tokenize(text)

  const filtered = rawTokens.filter(token => {
    if (!token) return false
    if (stopWords.has(token)) return false
    if (weakParticles.has(token)) return false
    if (token.length <= 2) return false
    return true
  })

  const carriers = []
  const verbs = []
  filtered.forEach(token => {
    if (isVerb(token)) {
      verbs.push(token)
    } else {
      carriers.push(token)
    }
  })

  return { rawTokens, filtered, carriers, verbs }
}

function scoreFields({ filtered, verbs }) {
  return metaphoricFields.map(field => {
    const carrierScore = filtered.reduce(
      (score, token) => score + (field.keywords.some(k => token.includes(k)) ? 2 : 0),
      0
    )
    const verbScore = verbs.reduce(
      (score, token) => score + (field.verbs.some(v => token.includes(v)) ? 1.5 : 0),
      0
    )
    return { field, score: carrierScore + verbScore }
  })
}

function hashSeed(tokens) {
  return tokens.join('-').split('').reduce((a,c)=> (a*31 + c.charCodeAt(0))%9973, 11)
}

function pickUnique(list, seed, n, key = 'label') {
  const out = []
  let i = seed
  while (out.length < n && list.length) {
    const candidate = list[Math.abs(i) % list.length]
    const value = typeof candidate === 'string' ? candidate : candidate[key]
    if (!out.some(entry => (typeof entry === 'string' ? entry : entry[key]) === value)) {
      out.push(candidate)
    }
    i += 7
  }
  return out
}

function buildTags(field, tokenAnalysis, seed) {
  const freq = tokenAnalysis.carriers.reduce((m,t)=>(m.set(t,(m.get(t)||0)+1),m), new Map())
  const dominantWords = [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(([t,c])=>({ label: t, strength: Math.min(1.2, 0.6 + c*0.2) }))
  const merged = [...dominantWords, ...field.tags.map(label => ({ label, strength: 0.9 }))]
  const uniq = merged.filter((entry, index) => merged.findIndex(other => other.label === entry.label) === index)
  const picked = pickUnique(uniq, seed, Math.min(4, uniq.length), 'label')

  return picked.map((entry, index) => ({
    id: `tag-${entry.label}-${index}`,
    label: entry.label,
    level: 'tag',
    strength: Number.parseFloat(entry.strength.toFixed(2)),
  }))
}

function craftEchoes(field, tokens, seed) {
  const textures = ['comme','presque','doucement','lentement','en sourdine']
  const feelings = ['tient','retient','attend','cherche','se glisse']
  const anchors = field.images.length ? field.images : ['un geste discret']
  const words = pickUnique(tokens.filtered, seed+7, 3)

  return pickUnique(anchors, seed+3, 3).map((img,i)=>{
    const t = textures[Math.abs(seed+i*11)%textures.length]
    const f = feelings[Math.abs(seed+i*13)%feelings.length]
    const w = words[i] || field.tags[i] || field.label.toLowerCase()
    return `${t} ${img}, ${f} ${w}.`
  })
}

function decorateNode(base) {
  const style = nodeStyles[base.level]
  const safeStrength = Math.max(0.4, base.strength || 1)
  return {
    color: style?.color,
    orbit: Math.round(style?.orbit + safeStrength * 6),
    size: Math.round(style?.size + safeStrength * 4),
    ...base,
  }
}

function buildGraph(tokens, field, secondary, tags, echoes) {
  const nodes = []
  const links = []

  const freq = tokens.filtered.reduce((m,t)=>(m.set(t,(m.get(t)||0)+1),m), new Map())
  ;[...freq.entries()].forEach(([t,c],i)=>{
    nodes.push(decorateNode({ id:`word-${t}-${i}`, type:'word', level:'word', label:t, strength:Math.min(1.4,0.8+c*0.25), emoji:'•' }))
  })

  tags.forEach((tag)=> nodes.push(decorateNode({ ...tag, type:'tag', emoji:'✧' })))

  const metas = [field, ...secondary.slice(0,2)].map((f,i)=>decorateNode({
    id:`metaphor-${f.id}-${i}`,
    type:'metaphor',
    level:'metaphor',
    label:f.label,
    strength:1.6-i*0.2,
    emoji:f.emoji
  }))
  nodes.push(...metas)

  echoes.forEach((e,i)=> nodes.push(decorateNode({ id:`echo-${i}`, type:'echo', level:'echo', label:e, strength:1.2, emoji:'🫧' })))

  const tagNodes = nodes.filter(n=>n.level==='tag')
  const echoNodes = nodes.filter(n=>n.level==='echo')
  const wordNodes = nodes.filter(n=>n.level==='word')

  wordNodes.forEach((w,i)=>{
    const t = tagNodes[i % Math.max(tagNodes.length,1)]
    if (t) links.push({ id:`link-word-${i}`, source:w.id, target:t.id, strength:0.8+w.strength*0.1, distance: t.orbit - 8 })
  })

  tagNodes.forEach((t, tagIndex)=>{
    metas.forEach((m,i)=> links.push({ id:`link-tag-${tagIndex}-${i}`, source:t.id, target:m.id, strength:1.2-i*0.1, distance: m.orbit }))
  })

  echoNodes.forEach((e,i)=> links.push({ id:`link-echo-${i}`, source: metas[0].id, target:e.id, strength:1.3, distance: e.orbit }))

  return { nodes, links }
}

// --- FONCTION UNIQUE EXPORTÉE ---
export function generateResonantMorphosis(text) {
  const trimmed = (text || '').trim()
  const tokens = analyzeTokens(trimmed)
  if (!tokens.filtered.length) return { ...fallback, sourceText: trimmed }

  const scored = scoreFields(tokens).sort((a,b)=>b.score-a.score)
  const dominant = scored[0]
  if (!dominant || dominant.score === 0) return { ...fallback, sourceText: trimmed }

  const secondary = scored
    .filter(s=> s.field.id !== dominant.field.id && s.score > 0)
    .map(s=> s.field)

  const seed = hashSeed(tokens.filtered)
  const resonantTags = buildTags(dominant.field, tokens, seed+5)
  const metaphoricEchoes = craftEchoes(dominant.field, tokens, seed+9)
  const { nodes: graphNodes, links: graphLinks } =
    buildGraph(tokens, dominant.field, secondary, resonantTags, metaphoricEchoes)

  return {
    sourceText: trimmed,
    dominantMetaphoricField: dominant.field.label,
    emoji: dominant.field.emoji,
    resonantTags,
    metaphoricEchoes,
    graphNodes,
    graphLinks,
  }
}