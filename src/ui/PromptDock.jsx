import './PromptDock.css'

export function PromptDock({
  styles,
  usages,
  selectedStyle,
  selectedUsage,
  onStyleChange,
  onUsageChange,
  prompt,
  cloudEnabled,
  onToggleCloud,
}) {
  return (
    <div className="prompt-dock">
      <div className="prompt-controls">
        <label className="prompt-select">
          Style
          <select value={selectedStyle?.id ?? ''} onChange={(event) => onStyleChange?.(event.target.value)}>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </label>
        <label className="prompt-select">
          Usage
          <select value={selectedUsage?.id ?? ''} onChange={(event) => onUsageChange?.(event.target.value)}>
            {usages.map((usage) => (
              <option key={usage.id} value={usage.id}>
                {usage.label}
              </option>
            ))}
          </select>
        </label>
        <label className="prompt-toggle">
          <input type="checkbox" checked={cloudEnabled} onChange={(event) => onToggleCloud?.(event.target.checked)} />
          Activer l IA (optionnel)
        </label>
      </div>
      <div className="prompt-preview">
        <p className="muted">Prompt généré (local)</p>
        <pre>{prompt}</pre>
      </div>
    </div>
  )
}

export default PromptDock
