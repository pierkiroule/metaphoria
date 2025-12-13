import { buildResonanceGraph } from '../utils/graph'
import { metaphorsForToken } from './metaphors'
import { collectTags, dominantEmoji } from './tags'

export function generateEcho(tokens) {
  const metaphors = tokens.flatMap((token) => metaphorsForToken(token))
  const uniqueMetaphors = Array.from(new Set(metaphors))
  const tags = collectTags(tokens)
  const emoji = dominantEmoji(tokens)
  const graph = buildResonanceGraph(tokens, uniqueMetaphors)

  return {
    metaphors: uniqueMetaphors,
    tags,
    emoji,
    nodes: graph.nodes,
    edges: graph.edges,
  }
}
