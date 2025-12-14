import { Component } from 'react'

function AppCrashNotice({ error }) {
  return (
    <div className="app app-error">
      <div className="panel">
        <p className="brand">Metaphoria</p>
        <h1 className="headline">Impossible d’afficher la page</h1>
        <p className="lede">
          Une erreur est survenue avant l’initialisation du graphe. Cela arrive souvent sur des navigateurs ou
          webviews anciens qui bloquent certaines fonctions modernes.
        </p>
        <ul className="list error-list">
          <li className="list-row">Recharge la page et vérifie que le navigateur est à jour.</li>
          <li className="list-row">Si tu es en webview, ouvre plutôt dans un navigateur complet.</li>
          <li className="list-row">Désactive les bloqueurs réseaux le temps du chargement.</li>
        </ul>
        {error && (
          <p className="muted" role="status">
            Détails (console) : {error.message || String(error)}
          </p>
        )}
      </div>
    </div>
  )
}

export class AppBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed before render', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <AppCrashNotice error={this.state.error} />
    }

    return this.props.children
  }
}
