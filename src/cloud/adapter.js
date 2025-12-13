import { callNebius } from './nebius'

export async function sendPrompt(prompt, { provider = 'nebius', enabled = false } = {}) {
  if (!enabled) {
    return { provider: 'local', prompt, output: 'IA désactivée. Rien n a été envoyé.' }
  }

  if (provider === 'nebius') {
    return callNebius({ prompt })
  }

  return { provider, prompt, output: 'Provider inconnu. Aucun appel effectué.' }
}
