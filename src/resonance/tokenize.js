const STOPWORDS = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'au', 'aux']

export function tokenize(text) {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëîïôöùûüçœ\s-]/gi, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !STOPWORDS.includes(token))
}

export function uniqueTokens(tokens) {
  return Array.from(new Set(tokens))
}
