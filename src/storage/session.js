import { load, save } from './localStore'

const SESSION_KEY = 'echo-session'

export function loadSession() {
  return load(SESSION_KEY, {
    words: [],
    styleId: 'poetique',
    usageId: 'therapie',
    cloudEnabled: false,
  })
}

export function persistSession(payload) {
  const current = loadSession()
  const next = { ...current, ...payload }
  save(SESSION_KEY, next)
  return next
}
