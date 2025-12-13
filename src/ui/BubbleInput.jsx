import { useState } from 'react'
import './BubbleInput.css'

export function BubbleInput({ onSubmit, initialValue = '', recentTokens = [] }) {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.(value)
  }

  return (
    <div className="bubble-input">
      <form className="bubble-form" onSubmit={handleSubmit}>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Dépose tes mots ici…"
          className="bubble-field"
        />
        <button type="submit" className="bubble-send">
          Envoyer
        </button>
      </form>
      {recentTokens.length > 0 && (
        <div className="bubble-tokens">
          {recentTokens.map((token) => (
            <span key={token} className="bubble-token">
              {token}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default BubbleInput
