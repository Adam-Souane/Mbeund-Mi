# Règle stricte d'interaction : Jamais de Navigateur / DOM

- **Interdiction absolue d'ouvrir le navigateur ou le DOM** : Ne jamais utiliser `browser_subagent`, `open_browser_url`, ou toute inspection DOM / capture navigateur.
- **Méthode de travail** : Travailler directement et exclusivement sur le code source (`src/`, `backend/`, etc.).
- **Validation** : Effectuer toutes les vérifications et validations via les commandes du terminal (`npm run build`, linting, tests, etc.) sans jamais manipuler le DOM du navigateur.
