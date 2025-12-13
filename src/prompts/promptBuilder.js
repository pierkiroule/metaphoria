export function buildPrompt({ words, metaphors, tags, style, usage }) {
  const wordLine = words.length ? `Mots sources : ${words.join(', ')}` : 'Aucun mot déposé pour le moment.'
  const metaphorLine = metaphors.length
    ? `Résonances : ${metaphors.join(' · ')}`
    : 'Pas de résonance identifiée, rester dans l écoute.'
  const tagLine = tags.length ? `Tags : ${tags.join(', ')}` : 'Tags en attente.'

  const styleLine = style ? `Style : ${style.label} (${style.tone})` : 'Style libre.'
  const usageLine = usage ? `Contexte : ${usage.label} (${usage.intent})` : 'Contexte général.'

  return [wordLine, metaphorLine, tagLine, styleLine, usageLine].join('\n')
}
