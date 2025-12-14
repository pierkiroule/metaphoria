const FLOW_URL = 'https://esm.sh/@xyflow/react@12.4.0?bundle'
const FLOW_STYLE_URL = 'https://esm.sh/@xyflow/react@12.4.0/dist/style.css'
const STYLE_ID = 'xyflow-react-style'

let cachedFlowPromise

export function loadFlowClient() {
  if (!cachedFlowPromise) {
    cachedFlowPromise = import(/* @vite-ignore */ FLOW_URL)
  }
  return cachedFlowPromise
}

export function ensureFlowStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const link = document.createElement('link')
  link.id = STYLE_ID
  link.rel = 'stylesheet'
  link.href = FLOW_STYLE_URL
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}
