import { useEffect, useMemo, useState } from 'react'
import BubbleInput from '../ui/BubbleInput'
import EchoCanvas from '../ui/EchoCanvas'
import PromptDock from '../ui/PromptDock'
import RenderPanel from '../ui/RenderPanel'
import { generateEcho } from '../resonance/resonanceEngine'
import { tokenize, uniqueTokens } from '../resonance/tokenize'
import { STYLES } from '../prompts/styles'
import { USAGES } from '../prompts/usages'
import { buildPrompt } from '../prompts/promptBuilder'
import { sendPrompt } from '../cloud/adapter'
import { loadSession, persistSession } from '../storage/session'
import '../app/App.css'

function App() {
  const session = useMemo(() => loadSession(), [])
  const [tokens, setTokens] = useState(session.words ?? [])
  const [echo, setEcho] = useState(tokens.length ? generateEcho(tokens) : null)
  const [styleId, setStyleId] = useState(session.styleId ?? STYLES[0].id)
  const [usageId, setUsageId] = useState(session.usageId ?? USAGES[0].id)
  const [cloudEnabled, setCloudEnabled] = useState(Boolean(session.cloudEnabled))
  const [prompt, setPrompt] = useState('')
  const [cloudResult, setCloudResult] = useState(null)

  const selectedStyle = STYLES.find((item) => item.id === styleId) ?? STYLES[0]
  const selectedUsage = USAGES.find((item) => item.id === usageId) ?? USAGES[0]

  useEffect(() => {
    const builtPrompt = buildPrompt({
      words: tokens,
      metaphors: echo?.metaphors ?? [],
      tags: echo?.tags ?? [],
      style: selectedStyle,
      usage: selectedUsage,
    })
    setPrompt(builtPrompt)
    persistSession({ words: tokens, styleId, usageId, cloudEnabled })
  }, [tokens, echo, selectedStyle, selectedUsage, styleId, usageId, cloudEnabled])

  const handleDeposit = (value) => {
    const nextTokens = uniqueTokens(tokenize(value))
    setTokens(nextTokens)
    const nextEcho = generateEcho(nextTokens)
    setEcho(nextEcho)
    setCloudResult(null)
  }

  const handleSendToCloud = async () => {
    const response = await sendPrompt(prompt, { enabled: cloudEnabled })
    setCloudResult(response)
  }

  return (
    <div className="app-shell">
      <header className="app-hero">
        <div>
          <p className="eyebrow">Echo from Metaphoria / ECHORESO</p>
          <h1>Médiation symbolique locale, IA en option</h1>
          <p className="lede">
            Trois couches séparées : UI sensorielle, moteur de résonance local, cloud IA facultatif. Aucune
            donnée ne quitte la machine sans action explicite.
          </p>
        </div>
        <div className="pillars">
          <span>UI</span>
          <span>Moteur local</span>
          <span>IA cloud</span>
        </div>
      </header>

      <main className="app-grid">
        <section className="card">
          <h2>1. Déposer les mots</h2>
          <BubbleInput onSubmit={handleDeposit} recentTokens={tokens} />
        </section>

        <section className="card">
          <h2>2. Résonance locale</h2>
          <EchoCanvas echo={echo} />
        </section>

        <section className="card">
          <h2>3. Prompt prêt</h2>
          <PromptDock
            styles={STYLES}
            usages={USAGES}
            selectedStyle={selectedStyle}
            selectedUsage={selectedUsage}
            onStyleChange={setStyleId}
            onUsageChange={setUsageId}
            prompt={prompt}
            cloudEnabled={cloudEnabled}
            onToggleCloud={setCloudEnabled}
          />
        </section>

        <section className="card wide">
          <RenderPanel
            echo={echo}
            prompt={prompt}
            cloudEnabled={cloudEnabled}
            cloudResult={cloudResult}
            onSendToCloud={handleSendToCloud}
          />
        </section>
      </main>
    </div>
  )
}

export default App
