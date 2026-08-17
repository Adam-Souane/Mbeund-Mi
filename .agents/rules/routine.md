# Routine de Synchronisation de Conversation

Cette routine doit être exécutée au début de **CHAQUE** nouvelle conversation/tâche pour s'assurer que la branche de travail est à jour avec les derniers développements de l'équipe.

## Contexte des branches
- La branche principale d'intégration est `main` (ou `develop` si elle est créée ultérieurement).
- La branche de travail actuelle pour le backend est `feature/backend-mama-adam`.

## Routine de synchronisation

1. **Vérification et récupération des modifications distantes** :
   - Mettre à jour les références distantes :
     ```bash
     git fetch --all
     ```

2. **Synchronisation de la branche principale** :
   - Basculer sur la branche principale d'intégration (actuellement `main`, ou `develop` si disponible) :
     ```bash
     git checkout main
     ```
   - Récupérer les derniers changements :
     ```bash
     git pull origin main
     ```

3. **Mise à jour de la branche de fonctionnalité** :
   - Rebasculer sur votre branche de travail :
     ```bash
     git checkout feature/backend-mama-adam
     ```
   - Fusionner les changements de la branche principale dans votre branche de travail :
     ```bash
     git merge main
     ```
   - En cas de conflits, les résoudre proprement avant de poursuivre.

4. **Démarrage d'une nouvelle tâche** :
   - Une fois la synchronisation terminée, **toujours ouvrir une nouvelle conversation** dans l'Agent Manager pour débuter la tâche proprement.
   - Choisir le **Planning mode** pour les tâches d'architecture importantes (marquées par 🧠), et le mode direct pour les autres.
