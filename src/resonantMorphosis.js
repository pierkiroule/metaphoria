// src/resonantMorphosis.js

// --- STOP WORDS ---
const stopWords = new Set([
  'et','ou','de','des','du','la','le','les','un','une','en','dans','sur','sous','avec',
  'que','qui','quoi','où','au','aux','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes',
  'son','sa','ses','leur','leurs','pour','par','pas','ne','plus','je','tu','il','elle','on','nous',
  'vous','ils','elles','y','a','d','l',"l'","d'",
])

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
  resonantTags: ['silence','pause','écoute'],
  metaphoricEchoes: ['L’écho reste discret. Rien n’insiste pour l’instant.'],
  graphNodes: [],
  graphLinks: [],
}

// --- OUTILS ---
function tokenize(text) {
  // Avoid Unicode property escapes (\p{L}) that can break parsing on older WebViews/Safari
  // by explicitly covering common latin ranges. This keeps the app from failing to load with
  // a blank screen on devices that don't support the more modern regex features.
  return text
    .split(/[^a-zA-Z0-9À-ÿ]+/)
    .map(t => t.toLowerCase().trim())
    .filter(t => t && !stopWords.has(t))
}

function scoreFields(tokens) {
  return metaphoricFields.map(field => {
    const k = tokens.reduce((s,t)=> s + (field.keywords.some(k=>t.includes(k)) ? 2 : 0), 0)
    const v = tokens.reduce((s,t)=> s + (field.verbs.some(v=>t.includes(v)) ? 1 : 0), 0)
    return { field, score: k + v }
  })
}

function hashSeed(tokens) {
  return tokens.join('-').split('').reduce((a,c)=> (a*31 + c.charCodeAt(0))%9973, 11)
}

function pick(list, seed, n) {
  const out = []
  let i = seed
  while (out.length < n && list.length) {
    const c = list[Math.abs(i) % list.length]
    if (!out.includes(c)) out.push(c)
    i += 7
  }
  return out
}

function buildTags(field, tokens, seed) {
  const freq = tokens.reduce((m,t)=>(m.set(t,(m.get(t)||0)+1),m), new Map())
  const dom = [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(([t])=>t)
  const merged = [...dom, ...field.tags]
  const uniq = merged.filter((t,i)=> merged.indexOf(t)===i)
  return pick(uniq, seed, Math.min(4, uniq.length))
}

function craftEchoes(field, tokens, seed) {
  const textures = ['comme','presque','doucement','lentement','en sourdine']
  const feelings = ['tient','retient','attend','cherche','se glisse']
  const anchors = field.images.length ? field.images : ['un geste discret']
  const words = pick(tokens, seed+7, 3)

  return pick(anchors, seed+3, 3).map((img,i)=>{
    const t = textures[Math.abs(seed+i*11)%textures.length]
    const f = feelings[Math.abs(seed+i*13)%feelings.length]
    const w = words[i] || field.tags[i] || field.label.toLowerCase()
    return `${t} ${img}, ${f} ${w}.`
  })
}

function buildGraph(tokens, field, secondary, tags, echoes) {
  const nodes = []
  const links = []

  const freq = tokens.reduce((m,t)=>(m.set(t,(m.get(t)||0)+1),m), new Map())
  ;[...freq.entries()].forEach(([t,c],i)=>{
    nodes.push({ id:`word-${t}-${i}`, type:'word', label:t, weight:1+c*0.2, emoji:'•' })
  })

  tags.forEach((t,i)=> nodes.push({ id:`tag-${t}-${i}`, type:'tag', label:t, weight:1.1, emoji:'✧' }))

  const metas = [field, ...secondary.slice(0,2)].map((f,i)=>({
    id:`metaphor-${f.id}-${i}`, type:'metaphor', label:f.label, weight:1.6-i*0.15, emoji:f.emoji
  }))
  nodes.push(...metas)

  echoes.forEach((e,i)=> nodes.push({ id:`echo-${i}`, type:'echo', label:e, weight:1.2, emoji:'🫧' }))

  const tagNodes = nodes.filter(n=>n.type==='tag')
  const echoNodes = nodes.filter(n=>n.type==='echo')

  nodes.filter(n=>n.type==='word').forEach((w,i)=>{
    const t = tagNodes[i % Math.max(tagNodes.length,1)]
    if (t) links.push({ source:w.id, target:t.id, weight:1 })
  })

  tagNodes.forEach(t=>{
    metas.forEach((m,i)=> links.push({ source:t.id, target:m.id, weight:1.4-i*0.2 }))
  })

  echoNodes.forEach(e=> links.push({ source: metas[0].id, target:e.id, weight:1.6 }))

  return { nodes, links }
}

// --- FONCTION UNIQUE EXPORTÉE ---
export function generateResonantMorphosis(text) {
  const trimmed = (text || '').trim()
  const tokens = tokenize(trimmed)
  if (!tokens.length) return { ...fallback, sourceText: trimmed }

  const scored = scoreFields(tokens).sort((a,b)=>b.score-a.score)
  const dominant = scored[0]
  if (!dominant || dominant.score === 0) return { ...fallback, sourceText: trimmed }

  const secondary = scored
    .filter(s=> s.field.id !== dominant.field.id && s.score > 0)
    .map(s=> s.field)

  const seed = hashSeed(tokens)
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