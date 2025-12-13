import ecoreso from '../data/ecoreso.json'

export function metaphorsForToken(token) {
  if (!token) return []
  return ecoreso[token] ?? []
}

export function allMetaphors() {
  return ecoreso
}
