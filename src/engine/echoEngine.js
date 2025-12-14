export function generateEcho(text) {
  const tokens = text.toLowerCase().split(/\W+/)

  const matches = FIELDS.filter(field =>
    field.keywords.some(k => tokens.some(t => t.includes(k)))
  )

  if (!matches.length) {
    return [{
      id: 'silence',
      emoji: '…',
      label: 'Écoute',
    }]
  }

  return matches.map((field, i) => ({
    id: field.name + i,
    emoji: field.emoji,
    label: field.name,
  }))
}