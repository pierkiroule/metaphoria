const STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'dans', 'en', 'que', 'qui', 'ne', 'pas', 'plus', 'au', 'aux', 'avec', 'sur', 'pour', 'par'
]);

export function extractKeywords(input) {
  const cleaned = (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ' ');

  const tokens = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOPWORDS.has(word));

  const frequencies = tokens.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const unique = Object.entries(frequencies)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return unique;
}
