import { createId } from './uuid'

export function buildResonanceGraph(tokens, metaphors) {
  const tokenNodes = tokens.map((token) => ({ id: `token-${token}`, label: token, type: 'token' }))
  const metaphorNodes = metaphors.map((metaphor) => ({
    id: `metaphor-${metaphor}`,
    label: metaphor,
    type: 'metaphor',
  }))

  const edges = []

  tokenNodes.forEach((tokenNode) => {
    metaphorNodes.forEach((metaphorNode) => {
      edges.push({
        id: createId(),
        from: tokenNode.id,
        to: metaphorNode.id,
        weight: 1,
      })
    })
  })

  const nodes = [...tokenNodes, ...metaphorNodes]

  return { nodes, edges }
}
