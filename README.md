# Echo from Metaphoria

Webapp PWA mobile-first et offline-first. L'utilisateur dépose des mots dans une bulle, la fait s'envoler en swipe up, puis observe des échos métaphoriques issus d'ECHORESO. Aucun backend, aucune IA locale : tout est généré côté client à partir de données JSON et du stockage local.

## Installation
```
npm install
npm run dev
```

## Build
```
npm run build
```

## Déploiement GitHub Pages
La configuration Vite utilise `base: '/metaphoria/'` pour servir correctement l'app depuis `https://pierkiroule.github.io/metaphoria/`.

1. Construire : `npm run build`
2. Copier le contenu du dossier `dist` vers la branche `gh-pages` du dépôt GitHub (`git subtree push --prefix dist origin gh-pages` ou équivalent).
3. Activer GitHub Pages sur la branche `gh-pages` (dossier racine) si ce n'est pas déjà fait.

Le service worker généré par `vite-plugin-pwa` maintiendra l'app disponible hors-ligne après la première visite.

## Icônes PWA
Les fichiers `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png` et `public/favicon.txt` sont des placeholders purement textuels pour respecter la contrainte d'absence de binaires. Remplace-les manuellement avant publication par de vraies images PNG (192×192, 512×512 et une variante maskable) et un favicon adapté, en conservant les mêmes chemins ou en ajustant `manifest.webmanifest` et `vite.config.js` en conséquence.
