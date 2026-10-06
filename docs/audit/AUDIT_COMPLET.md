# Audit complet — MBEUND MI (branche `frontend-reconstruction`)

Date de l'audit : 6 octobre 2026 · Dernier commit analysé : `3ddb81a` · Arbre de travail propre.
Périmètre : 217 commits propres à la branche (depuis `main`), backend Django, modules IA, frontend React, CI/déploiement, documentation.

> **Méthode.** Analyse rejouée le 6 octobre 2026 avec les outils du projet : ESLint (qualité, React, accessibilité), Ruff (sécurité, bugs, complexité), pytest-cov et le build. Aucun outil d'analyse externe n'a été utilisé.

---

## 1. Verdict en une page

| Domaine | État | Note |
|---|---|---|
| Fonctionnel (citoyen + autorité) | Complet : 21 écrans métier, 28 routes, temps réel, chatbot, exports, itinéraire | Bon |
| Backend (API, auth, alertes) | 228 tests verts, couverture 78 % | Bon |
| IA (RF, LSTM, GEE, chatbot) | Fonctionne, mais classes rares mal détectées, 11 tests seulement | Moyen |
| Frontend | Lint 0 erreur / 0 avertissement, build OK, 39 tests, aucune mesure de couverture | Moyen |
| Sécurité du code | Aucune faille bloquante trouvée ; 3 points de configuration à traiter | Bon avec réserves |
| **Exploitation en production** | **Tâches périodiques et écoute MQTT non planifiées dans le dépôt** | **À risque** |
| Documentation | Plusieurs documents contredisent l'état réel | Faible |

**Les 4 points qui comptent avant la soutenance** : (1) planifier réellement les tâches périodiques en production, (2) démarrer l'écoute des capteurs ou documenter la démo, (3) audit de fin de travail par chaque membre, (4) corriger les documents périmés.

---

## 2. Mesures relevées (rejouées le 6 octobre 2026)

| Contrôle | Résultat |
|---|---|
| Tests backend (pytest, SQLite + GDAL) | **228 réussis, 0 échec** (2 min 28 s) |
| Couverture backend | **78 %** (3 556 instructions, 775 non couvertes) |
| Tests IA (`mbeund_mi_ia/tests`) | **11 réussis** |
| Tests frontend (Vitest) | **39 réussis** dans 7 fichiers |
| ESLint (SonarJS + React + hooks + a11y) | **0 erreur, 0 avertissement** |
| Ruff (règles par défaut du dépôt) | **0 erreur** |
| Build Vite | **OK** (12,8 s) ; plus gros paquet : graphiques 421 Ko (113 Ko gzip) |
| `npm audit` (dépendances de production) | **0 vulnérabilité** |
| Python d'exécution | local 3.10.11 · `render.yaml` 3.11.9 · CI 3.12 (voir A-6) |

Non rejoué : `pip-audit` et `bandit` ne sont pas installés. Les rapports du 3 octobre (`rapport_pff/sources/qualite/resultats/`) datent d'avant la montée vers Django 5.2 : ils ne sont plus représentatifs.

### Couverture backend — points faibles
| Fichier | Couverture |
|---|---|
| `alertes/weather_service.py` | 26 % |
| `api/services/backtesting_service.py` | 39 % |
| `alertes/flood_risk_predictor.py` | 58 % |
| `api/services/sms_service.py` | 62 % |
| `alertes/consumers.py` (WebSocket) | 70 % |
| Commandes `seed_*` et `executer_taches_periodiques` | 0 % |

---

## 3. Constats de sécurité

### Aucune faille bloquante dans le code versionné
- Pas de secret en dur dans les sources : les 27 alertes « mot de passe codé en dur » de Ruff sont **toutes dans des fichiers de test** (faux positifs).
- Secrets exclus de Git : `.env`, `firebase_credentials.json`, `db.sqlite3` sont ignorés et non suivis.
- Production : HSTS, redirection HTTPS, `DEBUG=False`, `ALLOWED_HOSTS` obligatoire, `SECRET_KEY` sans valeur par défaut, limitation de débit active.
- Jeton WebSocket transmis par sous-protocole, jamais dans l'URL (testé).
- Webhook SMS entrant signé ; points d'accès sensibles réservés aux autorités.

### À traiter
| Réf. | Gravité | Constat | Action |
|---|---|---|---|
| S-1 | **Élevée** | Le fichier local `.claude/settings.local.json` contient en clair le mot de passe de la base Neon de production (dans des commandes autorisées). Il n'est pas versionné (ignoré par la configuration Git globale) mais il est lisible sur le poste et dans toute sauvegarde. | **Changer le mot de passe Neon**, puis supprimer ces entrées. |
| S-2 | Moyenne | `.env` à la racine pointe `VITE_API_URL` vers la **production** : un `npm run dev` écrit dans la base réelle (incident déjà survenu le 4 octobre). | Mettre l'URL locale dans `.env.local`, garder la production dans le seul environnement de déploiement. |
| S-3 | Moyenne | Jetons JWT stockés en `localStorage` (documenté dans `tokenStorage.js`) : lisibles par tout script injecté. | Ajouter une politique CSP stricte ; à terme, cookies httpOnly. |
| S-4 | Faible | 13 chargements `pickle` des modèles (`S301`) sur des fichiers du dépôt : sûr tant que les fichiers restent de confiance. | Vérifier une empreinte SHA-256 avant chargement. |
| S-5 | Faible | 4 blocs `try/except/pass` dans l'IA (`service_prediction.py:77,195`, `consumers.py:105`…) : erreurs avalées sans trace. | Journaliser l'exception. |
| S-6 | Faible | Le simulateur de capteurs utilise `random` (`S311`) : sans enjeu cryptographique. | Aucune (faux positif). |

---

## 4. Constats de qualité du code

### Complexité (seuil 12) — 8 fonctions à découper
| Fonction | Complexité |
|---|---|
| `api/serializers.py` · `wkt_to_geojson` | 23 |
| `mbeund_mi_ia/ia/service_prediction.py` · `analyser_risque` | 19 |
| `api/serializers.py` · `parse_lon_lat` | 16 |
| `alertes/tasks.py` · `predire_risques_avec_random_forest` | 15 |
| `users/views.py` · `register` | 14 |
| `api/serializers.py` · `parse_polygon_coords` | 13 |
| `mbeund_mi_ia/ia/service_prediction.py` · `recuperer_historique_24j` | 13 |
| `mbeund_mi_ia/simulateur/capteurs.py` · `main` | 13 |

### Autres
- **Règles Ruff du dépôt trop étroites** (`E4,E7,E9,F`) : elles ne détectent ni les bugs probables (`B`), ni la simplification (`SIM`), ni la sécurité (`S`), ni la complexité (`C901`). C'est la raison pour laquelle « Ruff 0 erreur » est rassurant mais peu exigeant.
- Fichiers de résultats de tests versionnés : `backend/test_results*.txt` (3 fichiers) à retirer.
- Modèles binaires volumineux versionnés (`modele_rf_calibre.pkl` ≈ 9,5 Mo) : alourdissent chaque clone.
- Dossier `src/pages/` isolé (`PredictionsDashboard`) hors de la convention `autorite/` / `citizen/`.
- `README.md` : démarrage via `env\Scripts\activate` (environnement Windows local), n'énumère pas les routes d'authentification OTP, parle de « PFE » alors que le rapport est un PFF.

---

## 5. Constats sur l'IA

Mesures du modèle (jeu de test 2022-2024, `mbeund_mi_ia/data/metriques_rf.json`) :

| Modèle | Exactitude | F1 macro | F1 orange | F1 rouge |
|---|---|---|---|---|
| Toujours « vert » (référence) | 0,942 | 0,242 | 0,00 | 0,00 |
| Persistance (référence) | 0,962 | 0,670 | 0,40 | 0,67 |
| Random Forest | 0,935 | 0,542 | 0,24 | 0,44 |
| Random Forest calibré | 0,953 | 0,481 | **0,00** | 0,50 |

À retenir : le modèle est **moins bon que la simple « persistance »** sur le F1 macro, et le modèle calibré **ne détecte aucun orange**. Les effectifs de test sont minuscules (10 orange, 3 rouge) : toute conclusion statistique est fragile. Le projet a déjà ajouté un garde-fou (seuil de pluie minimal) et supprimé la fuite de données ; il faut maintenant **présenter ces chiffres honnêtement** (rapport et soutenance) plutôt que de les masquer.

Autres points : LSTM actif seulement avec 24 jours d'historique par zone ; 11 tests IA ; GEE nécessite une authentification manuelle une fois par machine.

---

## 6. Exploitation et déploiement (risque principal)

| Réf. | Constat | Conséquence |
|---|---|---|
| A-1 | `CELERY_TASK_ALWAYS_EAGER=True` par défaut et `render.yaml` ne déclare **aucun worker, aucun beat ni aucune tâche planifiée**. La commande `executer_taches_periodiques` existe mais rien ne l'appelle. | En production, météo (3 h), prédictions (6 h) et analyse satellite (12 h) **ne se lancent pas toutes seules**. |
| A-2 | Aucun processus `ecoute_mqtt` dans `render.yaml`. | Aucune mesure de capteur n'entre en production ; seules les données `seed_capteurs` existent. |
| A-3 | SMS OTP : identifiants Orange en attente d'approbation ; Twilio d'essai refuse le Sénégal. | Inscription par e-mail uniquement tant que le SMS est fermé. |
| A-4 | `docs/DEPLOIEMENT.md` affirme que `Dockerfile`, `docker-compose.yml` et `entrypoint.sh` ont été retirés, or `backend/Dockerfile`, `nginx/`, `mosquitto/` et `scripts/deploy.sh` sont toujours là. | Documentation contradictoire : personne ne sait quelle voie est la bonne. |
| A-5 | Démarrage Render : la commande `daphne` est dans `render.yaml` mais doit aussi être alignée dans le tableau de bord Render si le service n'est pas synchronisé. | Sans cela, pas de WebSocket en ligne. |
| A-6 | Versions de Python : 3.10 local, 3.11.9 Render, 3.12 CI et Dockerfile, `ruff target-version=py310`. Google arrête le support de 3.10 (avertissement observé). | Un bogue peut n'apparaître qu'en production. |

---

## 7. Constats frontend

- **Bien fait** : pages chargées à la demande (JS au démarrage 1 124 Ko → 357 Ko), accessibilité (jsx-a11y), thème clair/sombre, ErrorBoundary, validation Zod, hooks de données par ressource.
- **Tests** : 39 tests pour 123 fichiers source ; aucun outil de couverture installé (`@vitest/coverage-v8` absent), donc la couverture JavaScript n'est pas mesurée. Pas de test de bout en bout (Playwright/Cypress). Les pages les moins protégées : carte interactive, signalement avec photo, exports, gestion de crise, chat.
- **Dette** : `sonarjs/cognitive-complexity` et `no-nested-conditional` réglés en « avertissement » (aujourd'hui à 0, donc sain).

---

## 8. Constats base de données

- Schéma géré par les migrations Django (source de vérité) ; `sql/` et `seeds/` sont documentaires, ce qui est écrit dans le README.
- 16 modèles dans `alertes`, 2 dans `capteurs`, 4 dans `users`.
- Sauvegardes : `scripts/backup.sh` vise un VPS (`/opt/mbeund-mi`, cron) alors que la base est maintenant sur Neon ; aucune sauvegarde planifiée n'est décrite pour la base actuelle (`DEPLOIEMENT.md` cite seulement un `pg_dump` manuel).
- Index : `capteurs.Mesure` (table qui grossit le plus) n'a aucun index déclaré dans `capteurs/models.py` ; les index existent sur 3 modèles de `alertes`. À vérifier avec `EXPLAIN` sur les requêtes de la carte et des courbes.

---

## 9. Plan d'action priorisé

| Priorité | Action | Réf. |
|---|---|---|
| **P0 — avant la soutenance** | Changer le mot de passe Neon | S-1 |
| P0 | Planifier les tâches périodiques (cron Render → `executer_taches_periodiques`, ou worker + beat) | A-1 |
| P0 | Démarrer `ecoute_mqtt` ou assumer la démo avec les données `seed_capteurs` | A-2 |
| P0 | Audit complet de fin de travail par chaque membre | Plan de travail, R04 |
| P1 | Présenter honnêtement les limites du modèle (orange/rouge) | §5 |
| P1 | Séparer `.env` local et production | S-2 |
| P1 | Réécrire `DEPLOIEMENT.md` et `README.md` | A-4 |
| P1 | Aligner les versions Python partout | A-6 |
| P2 | Découper les 8 fonctions complexes | §4 |
| P2 | Couverture : services météo, backtesting, WebSocket, pages front critiques | §2 |
| P2 | Élargir les règles Ruff (`B`, `SIM`, `S`, `C901`) dans la CI | §4 |
| P3 | Empreinte des modèles, CSP, tests E2E, sauvegardes | S-3, S-4, §7, §8 |
