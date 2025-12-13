const STORAGE_KEY = 'echo-local'

function isReady() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function save(key, value) {
  if (!isReady()) return
  const current = loadAll()
  current[key] = value
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

export function load(key, fallback = null) {
  if (!isReady()) return fallback
  const current = loadAll()
  return current[key] ?? fallback
}

export function loadAll() {
  if (!isReady()) return {}
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch (error) {
    console.warn('localStorage corrupt, reset', error)
    window.localStorage.removeItem(STORAGE_KEY)
    return {}
  }
}
