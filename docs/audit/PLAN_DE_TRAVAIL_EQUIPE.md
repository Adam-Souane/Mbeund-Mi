# MBEUND MI — Plan de travail de l'équipe (15 jours)

Mis à jour le 6 octobre 2026 · Branche `frontend-reconstruction` (fusion du travail de toute l'équipe).
**Délai : 15 jours, du mardi 6 octobre au mardi 20 octobre 2026, code ET rapport compris.**
**Code gelé dimanche 11 octobre** (cette semaine). Ce fichier est le seul à lire : état du projet, tâches, rapport, soutenance, et qui fait quoi.
Détail technique des constats : [AUDIT_COMPLET.md](AUDIT_COMPLET.md).

> Hypothèses : le jour 1 est aujourd'hui (6 octobre) ; les comptes Render et Neon sont gérés par Maïmouna ; le budget du rapport est celui déjà fixé (environ 40 pages de corps : chapitre IV 11 pages, conclusion 2 pages). **Si la soutenance a lieu avant le 20 octobre, il faut tout reculer proportionnellement : dites-le-moi.**

---

## 1. Où en est le projet

Le projet est fonctionnel de bout en bout. Mesures du 6 octobre 2026 :

| Contrôle | Résultat |
|---|---|
| Tests backend | 228 réussis, couverture 78 % |
| Tests IA | 11 réussis |
| Tests frontend | 39 réussis |
| ESLint (qualité, React, accessibilité) | 0 erreur, 0 avertissement |
| Build frontend | OK |
| `npm audit` | 0 vulnérabilité |

| Domaine | Déjà réalisé |
|---|---|
| **Base de données** | Modélisation PostGIS, seeds, dictionnaire de données, MCD/UML, triggers, 22 modèles avec migrations, `is_synthetic`, Neon, Redis Upstash, MQTT HiveMQ |
| **Backend** | API REST complète, JWT avec rôles, limitation de débit, OTP e-mail/SMS, mot de passe oublié, autorités par code d'invitation, suivi d'activité, signalements (géorepérage, photo), signalement par SMS, exports CSV/PDF, itinéraire d'évacuation, refuges, relais de quartier, vulnérabilité, Swagger |
| **Temps réel** | WebSocket sécurisé, notifications unifiées, push Firebase, SMS d'alerte (Orange, Twilio, WhatsApp) |
| **IA** | Random Forest calibré, LSTM 24 h, détection satellite (GEE), météo, anomalies, chatbot NDAM, fiabilité, backtesting, simulateur, démonstration |
| **Frontend** | Espace citoyen (6 écrans), espace autorité (15 écrans), pages d'accès, carte, thème clair/sombre, accessibilité |
| **Qualité / déploiement** | CI GitHub, Render ASGI (daphne), dépendances à jour, correctifs de sécurité |
| **Rapport PFF** | Page de garde, liminaires, introduction, chapitres I, II, III |

**Reste à produire** : correctifs de production (section 3), chapitre IV, conclusion, webographie, annexes, 16 points à vérifier dans le rapport, audits de fin de travail, diaporama de soutenance, répétition.

---

## 2. Calendrier commun

| Jour | Date | Tout le monde |
|---|---|---|
| J1–J6 | mar 6 → dim 11 oct | **Code** de ses tâches (section 3) **et brouillon de sa section du rapport** en parallèle |
| **J6** | **dim 11 oct** | **Gel du code** : tout est fusionné, CI verte |
| J7 | lun 12 | Chacun relance les contrôles sur sa partie (section 6) et commence son audit de fin de travail (R04) |
| J8 | mar 13 | Audit déposé dans `docs/audit/` ; sa section du rapport est **finale** (chiffres à jour) |
| J9 | mer 14 | Maïmouna intègre les 4 sections et génère le rapport v3 |
| J10 | jeu 15 | Relecture croisée du rapport (chacun relit la section d'une autre personne) |
| J11 | ven 16 | Chacun corrige **sa** section ; tous les marqueurs jaunes `[[...]]` disparaissent |
| J12 | sam 17 | Rapport final v4 ; chacun dépose ses 3 à 4 diapositives |
| J13 | dim 18 | **Marge de sécurité** (retard, imprévus) |
| J14 | lun 19 | Répétition complète de la soutenance et de la démonstration |
| J15 | mar 20 | Livraison / dernière marge |

---

## 3. Tâches de code par membre (J1 à J6)

Chaque membre ne touche **que les fichiers listés comme siens** : c'est ce qui évite que l'un attende l'autre (section 5).
Hors délai (reporté après la soutenance) : tests de bout en bout Playwright, CSP et cookies httpOnly, empreintes des modèles, worker Celery payant, sauvegardes Neon planifiées, découpage des 8 fonctions complexes, élargissement des règles Ruff, plan de collecte de mesures. Ils figurent dans l'audit comme dette connue.

### Maïmouna SALL — IA, accès aux comptes, intégration du rapport
Fichiers à elle : `mbeund_mi_ia/`, `backend/.env`, comptes Render / Neon / Orange, `rapport_pff/`.

| Réf. | Jour | Tâche | Critère de fin |
|---|---|---|---|
| R00 | **J1 matin** | Donner à Mama Adam l'accès collaborateur à Render (et en lecture à Neon) | Mama Adam peut ouvrir Render |
| R01 | J1 | Changer le mot de passe Neon, le mettre à jour dans Render, supprimer les mots de passe écrits dans `.claude/settings.local.json` | Ancien mot de passe invalide, site toujours en ligne |
| R06 | J1 puis en attente | Relancer Orange (identifiants, nom d'expéditeur « MBEUND MI »). **Ne bloque personne** : l'inscription fonctionne par e-mail en attendant | Un code OTP reçu par SMS, sinon démonstration par e-mail |
| R07 | J2–J3 | Choisir le modèle servi en production ; rédiger les limites : F1 orange 0,24 (Random Forest) et 0,00 (calibré), 10 cas orange et 3 rouges dans le jeu de test | Choix noté dans le code et dans le rapport |
| R20 | J3 | Journaliser les `try/except/pass` de `service_prediction.py` (lignes 77 et 195) | Plus d'erreur avalée |
| R16 | J4–J6 | Tests IA : service de prédiction, chatbot, GEE simulé (11 tests aujourd'hui) | Couverture IA mesurée et notée |
| R05b | J6 | Appliquer dans le tableau de bord Render ce que Mama Adam a fusionné (`render.yaml`, cron) | Services en ligne conformes au dépôt |


### Mama Adam SOUANE — Backend, déploiement, CI
Fichiers à lui : `backend/` (sauf `migrations/`), `render.yaml`, `runtime.txt`, `ruff.toml`, `.github/`, `docs/DEPLOIEMENT.md`, `backend/requirements.txt`.

| Réf. | Jour | Tâche | Critère de fin |
|---|---|---|---|
| R02 | J1–J2 | Planifier les tâches périodiques en production : cron Render appelant `python manage.py executer_taches_periodiques` (déclaré dans `render.yaml`), ou worker + beat | Météo, prédictions et analyse satellite tournent seules, visibles dans les journaux |
| R03 | J2–J3 | Écoute des capteurs : démarrer `ecoute_mqtt` en production, **ou** décider que la démonstration utilise `seed_capteurs` (décision écrite dans `DEPLOIEMENT.md`) | Décision écrite ou processus actif |
| R05 | J3 | Vérifier que la commande de démarrage Render est `daphne` | WebSocket fonctionnel en ligne |
| R10 | J3 | Python 3.12 partout : `runtime.txt`, `render.yaml`, `ruff.toml`, CI | Une seule version dans le dépôt |
| R19 | J4 | Retirer `backend/test_results*.txt` du suivi Git ; noter la décision sur les `.pkl` | Fichiers retirés |
| R15a | J4–J6 | Couverture : `weather_service` (26 %), `backtesting_service` (39 %), `sms_service` (62 %) | Chacun ≥ 60 % |
| R09b | J5–J6 | Réécrire `docs/DEPLOIEMENT.md` (Render + Neon + Upstash + HiveMQ ; sort de `Dockerfile`, `nginx/`, `mosquitto/`, `deploy.sh`) | Aucune contradiction avec le dépôt |

### Mame Diarra DIANE — Base de données, jeu de données de démonstration
Fichiers à elle : `backend/*/migrations/` (**elle seule crée des migrations**), `sql/`, `seeds/`, `docs/db_schema.md`, `diagrams/`, `README.md`, `backend/*/management/commands/seed_*`, nouveaux fichiers de test de commandes.

| Réf. | Jour | Tâche | Critère de fin |
|---|---|---|---|
| R25 | J1–J2 | Index sur `capteurs.Mesure` (aucun aujourd'hui) ; comparer les requêtes de la carte et des courbes avec `EXPLAIN` | Migration + temps avant/après |
| R28 | J2–J3 | `docs/db_schema.md` et MCD alignés sur les 22 modèles actuels | Documents à jour |
| R29 | J3 | `sql/` et `seeds/` : lister ou corriger les contradictions avec les migrations | Liste faite |
| R32 | J3–J4 | **Jeu de données de démonstration** : comptes citoyen / autorité / administrateur, capteurs, zones, quelques alertes (via `seed_*`, rejouable en une commande) | Base de démo reconstruite en une commande, procédure écrite |
| R15b | J4–J5 | Tests des commandes `seed_*` et `executer_taches_periodiques` (0 % aujourd'hui) | Commandes testées (nouveau fichier de test) |
| R09a | J5–J6 | Réécrire `README.md` selon l'état réel (démarrage, routes d'authentification OTP, rôles) | Un camarade démarre le projet avec le seul README |

### Ngoné GUEYE — Frontend
Fichiers à elle : `src/`, `.env.example` (racine), `vite.config.js`, `eslint.config.js`, `package.json`.

| Réf. | Jour | Tâche | Critère de fin |
|---|---|---|---|
| R08 | J1 | Séparer local et production : `VITE_API_URL` pointe vers la production dans `.env`. Mettre l'URL locale dans `.env.local` et documenter dans `.env.example` | `npm run dev` n'écrit plus en production |
| R21 | J1 | Déplacer `src/pages/PredictionsDashboard` dans `src/autorite/pages/` | Arborescence cohérente, build OK |
| R17 | J2–J4 | Installer `@vitest/coverage-v8`, viser 50 % ; tester d'abord la carte, le signalement avec photo, les exports, la crise, le chat | Rapport de couverture ≥ 50 % |
| R30 | J4–J5 | Passage d'accessibilité manuel (clavier, lecteur d'écran) sur les 6 écrans citoyens | Défauts listés et corrigés |
| R33 | J5–J6 | **Scénario de test manuel de bout en bout** (inscription → OTP → signalement → alerte reçue) écrit sous forme de liste de vérification ; exécuter sur la base de démo ; **captures d'écran** des 21 écrans pour le rapport et le diaporama | Liste exécutée, captures déposées dans `rapport_pff/sources/fig/` |

---

## 3 bis. Avancement de Maïmouna (6 octobre 2026)

| Réf. | Statut | Détail |
|---|---|---|
| R01 | Fait | Mot de passe base de données modifié sur Neon et mis à jour sur Render |
| R07 | Fait | Limites du modèle rédigées dans le rapport v4 (4.3.2, résumé, conclusion) à partir de `metriques_rf.json` |
| R20 | Fait | Les erreurs avalées de `service_prediction.py` sont journalisées |
| R13a | Fait | `analyser_risque` (complexité 19) et `recuperer_historique_24j` (13) découpés en petites fonctions ; comportement inchangé (228 tests backend et 41 tests IA réussis) |
| R16 | Fait | 30 tests ajoutés sur le service de prédiction (IA : 11 à 41 tests) |
| LSTM | Fait | Réentraîné sur 15 ans de pluie avec la pluie prévue en entrée : erreur de 2,8 cm contre 5,0 cm pour la persistance (niveau d'eau reconstitué) ; service et tâche Celery adaptés |
| R06, R00, R05b | En attente | En attente de l'e-mail de Mama Adam (Render) et du retour d'Orange (SMS) |
| Rapport | Fait | 3.4 (valeurs actuelles), 4.1.1, 4.1.4, 4.2.3 (scénarios rejoués), 4.3.2, conclusion, résumé resserré, annexe 5, chiffres externes de l'introduction vérifiés sur des sources |
| Rapport | Fait | 1.2.1 origine du projet (récit des auteures), mesure du LSTM refaite le 6 octobre (résultat identique) |
| Rapport | Fait | Introduction resserrée à 3 pages |
| Rapport | Fait | Simulations de seuils refaites avec le seuil de 15 mm (tableau 17 du rapport) |
| R23, R27 | Reportés | Après la soutenance |

---

## 4. Rapport PFF et soutenance (en parallèle du code)

Le rapport suit désormais le **plan officiel de l'ISEP-AT** (page de garde et plan commun à tous les groupes). **Lire [ADAPTATION_RAPPORT_ISEP.md](ADAPTATION_RAPPORT_ISEP.md)** : il explique le nouveau plan, les contenus périmés à corriger et les décisions à prendre.
Le rapport à jour est `Rapport_PFF_MBEUND_MI_v3.docx` (squelette de 49 pages, consignes surlignées en jaune).

**Chacun écrit dans son propre fichier du dépôt : `docs/rapport/<prenom>.md`** (créés avec les titres à remplir). Maïmouna intègre le mercredi 14 octobre. Brouillon avec les chiffres du 6 octobre dès maintenant, version finale le mardi 13.

### Plan officiel et rédacteurs

| Partie du rapport | Pages visées | Rédacteurs |
|---|---|---|
| Introduction générale | 2 à 3 | Maïmouna (resserrer) |
| **1 Présentation du cadre du projet** | 4 à 6 | 1.1 ISEP-AT : Mame Diarra · 1.2.1 origine : Maïmouna · 1.3 outils : Mama Adam |
| **2 Analyse de l'existant et cadrage** | 6 à 8 | 2.1 à condenser : Ngoné (2.1.1–2.1.2), Mame Diarra (2.1.3–2.1.4) · 2.2 critique : Ngoné · 2.4 solutions : Mama Adam · 2.5 Gantt : Mame Diarra |
| **3 Conception de la solution** | 8 à 12 | Déjà rédigé ; **3.4 à corriger** : Maïmouna et Mama Adam |
| **4 Réalisation, tests et résultats** | 8 à 12 (plafond) | 4.1.1, 4.1.4, 4.2.3, 4.3.2 : Maïmouna · 4.1.2 : Mame Diarra · 4.1.3, 4.3.1, 4.4 : Mama Adam · 4.1.5, 4.2.1, 4.2.2, 4.3.3 : Ngoné · 4.5 : chacun valide ses lignes |
| Conclusion générale et perspectives | 1 à 2 | Maïmouna (rappel, bilan) ; chacun 3 à 4 lignes d'apports |
| Annexes | — | Chacun la sienne (IA, API, données, captures) |
| Bibliographie APA | — | Chacun ses sources ; Maïmouna fusionne |

### Points surlignés des chapitres déjà écrits (16) et décisions

Les 16 points « à vérifier » des anciens chapitres sont répartis, à raison de 4 par personne, dans les fichiers `docs/rapport/<prenom>.md` (section « Points surlignés »). Les décisions D1 à D5 (option de la filière, intitulé du thème, année académique, hypothèses, encadreur professionnel) sont dans le guide d'adaptation.

### Soutenance
| Qui | Livrable | Quand |
|---|---|---|
| Chacun | 3 à 4 diapositives sur sa partie (`diapos_<prenom>.md` ou fichier de présentation) | J12 |
| Chacun | Les questions probables du jury sur sa partie, avec réponses (1 page) | J12 |
| Maïmouna | Assemblage du diaporama ; scénario de démonstration IA | J12 |
| Mame Diarra | Procédure de remise à zéro de la base de démo avant la répétition | J12 |
| Équipe | Répétition complète chronométrée | J14 |

---

## 5. Comment personne n'attend personne

| Risque d'attente | Comment c'est évité |
|---|---|
| Mama Adam a besoin de Render pour R02 / R05 | **R00 : accès donné à J1 matin.** Sans accès, il livre le code (`render.yaml`, commande testée en local) et Maïmouna l'applique à J6 (R05b) : son travail n'est pas bloqué |
| Changement du mot de passe Neon qui casse le site | Maïmouna le fait seule à J1 (Neon et Render sont chez elle) |
| Deux personnes créent chacune une migration Django | **Mame Diarra seule** crée les migrations. Les autres demandent par message ; personne n'attend, la demande attend simplement la fin de sa tâche en cours |
| Deux personnes modifient le même fichier | Chaque fichier a un seul propriétaire (section 3). Fichier partagé nécessaire → on le demande au propriétaire, qui l'applique dans la journée |
| README et DEPLOIEMENT.md se contredisent | Deux fichiers, deux propriétaires : README (Mame Diarra), DEPLOIEMENT (Mama Adam). Chacun écrit son propre sujet sans lire l'autre |
| Le chapitre IV a besoin des mesures de tous | Chacun rédige avec les chiffres du **6 octobre** déjà dans ce plan et les met à jour à J8 |
| Le rapport a besoin des captures d'écran | Les rédacteurs écrivent avec un emplacement `[[figure]]` ; Ngoné dépose les captures dans `docs/rapport/captures/` à J6 |
| Intégration du rapport | Chacun écrit **dans son propre fichier** `docs/rapport/<prenom>.md` (suivi par Git) ; Maïmouna assemble à J9. Personne d'autre ne modifie le fichier Word |
| Relecture qui bloque la fusion | **La relecture ne bloque jamais** : on fusionne dès que la CI est verte, la relecture se fait après, dans les 24 h |
| Audit R04 qui attend la fin des autres | Chacun audite **sa partie seule** à J7–J8 ; les audits ne se lisent pas entre eux |
| Démonstration qui dépend de la base de démo | Mame Diarra la livre à J4 (R32) : tous les autres l'utilisent à partir de J5, avant cela ils utilisent les `seed_*` existants |

---

## 6. Audit de fin de travail (R04) — chacun, J7 à J8

Quand un membre a terminé ses tâches, il fait **un audit complet et détaillé de sa partie** et le dépose dans `docs/audit/AUDIT_<prenom>.md`. Contenu :

1. **Périmètre** : fichiers et fonctionnalités audités.
2. **Ce qui a été fait** : tâches `Rxx` terminées et commits.
3. **Mesures** : tests (nombre, réussis, couverture), contrôle de style, compilation.
4. **Sécurité** : secrets, droits d'accès, données personnelles, dépendances.
5. **Défauts restants** : gravité, impact, décision (corrigé, accepté, reporté).
6. **Limites connues** : ce qui n'a pas pu être vérifié, et pourquoi.
7. **Ce qu'il faut savoir expliquer à l'oral.**

Commandes : `npm run lint`, `npm test`, `npm run build` (frontend) ; `ruff check backend mbeund_mi_ia` et `pytest` dans `backend/` puis `mbeund_mi_ia/` (Python). Modèle de l'état actuel : [AUDIT_COMPLET.md](AUDIT_COMPLET.md).

---

## 7. Règles de travail

1. **Une branche par personne**, créée à partir de `frontend-reconstruction` (`feature/<prenom>`), fusionnée **par son auteur dès que la CI est verte**.
2. Un commit = une tâche, avec la référence `Rxx` dans le message.
3. On ne modifie pas les fichiers d'un autre : on lui écrit.
4. Aucun mot de passe, jeton ou clé dans un fichier suivi par Git.
5. Point de 10 minutes chaque matin (message ou appel) : « fait hier / prévu aujourd'hui / bloqué ? ». Un blocage se signale **le jour même**.
6. En cas de retard, la marge est J13. Si une tâche glisse au-delà, elle est reportée après la soutenance et notée dans l'audit ; **le rapport et la démonstration passent avant toute amélioration de code**.

---

## 8. Limites de ce plan

- Chiffres issus d'ESLint, de Ruff, de pytest et du build rejoués le 6 octobre 2026 ; aucun outil d'analyse externe.
- Le déploiement Render réel, l'API Orange réelle, la signature Twilio réelle et la CI sous Linux n'ont pas pu être testés depuis le poste d'audit.
- Les rédacteurs de chaque section sont ceux dont le travail est décrit ; l'équipe peut échanger les rôles tant que chaque section a un seul rédacteur.
