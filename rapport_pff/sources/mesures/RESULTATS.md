# Mesures pour le chapitre IV (3 octobre 2026)

Scripts dans ce dossier, exécutés avec l'environnement `env/` du projet, sans modifier les modèles.

## Tests automatisés (runtests.sh : SQLite local, aucun service externe)
- Avant corrections : 109 réussis, 5 échecs, 1 ignoré (backend). Les 5 échecs venaient d'une permission non instanciée (`/api/contacts-alerte/`, `/api/relais-quartier/`) qui renvoyait une erreur 500.
- Après corrections : backend 124 réussis, 1 ignoré, 0 échec (dont 10 nouveaux tests dans `alertes/test_diffusion.py`) ; module IA 11 réussis.

## Random Forest 4 niveaux (mbeund_mi_ia, mesures_a.py)
- Jeu de test : 1 096 jours (20 % de 2010-2024) : 1 048 vert, 37 jaune, 9 orange, 2 rouge.
- Exactitude 100 % avant et après calibration ; F1 macro 1,0.
- Score de Brier 0,00096 → 0,00038 après calibration isotonique (−60 %) ; perte log 0,00228 → 0,00126.
- Importances : niveau_eau_cm 59 %, cumul 72 h 35 %, pluie du jour 3 %, cumul 24 h 2 %.
- À interpréter : l'étiquette est calculée à partir de niveau_eau_cm (reconstitué : 1,5 × cumul 72 h + bruit), qui est aussi une variable d'entrée. Le modèle retrouve une règle écrite par l'équipe, ce n'est pas une performance de terrain.

## LSTM (mesures_lstm.py)
- Entraîné sur 190 séquences de 24 jours issues de pluies_simulees_anams.csv (214 jours simulés), 5 époques (fichiers du commit du 7 juin 2026).
- Validation (38 séquences) : MAE 8,01 cm, RMSE 11,52 cm.
- Référence naïve « demain = aujourd'hui » : MAE 6,04 cm, RMSE 9,05 cm → le LSTM fait moins bien que la référence.

## Random Forest 3 classes de la tâche planifiée (mesures_b.py)
- 25 épisodes construits (2020-2026) × 7 zones topographiques ; 15 Moyen, 7 Grave, 3 Faible ; 100 arbres, profondeur 10, classes équilibrées.
- Exactitude sur l'apprentissage 100 % ; validation croisée « un contre tous » 80 % (référence classe majoritaire 60 %).
- Matrice LOO (Faible, Moyen, Grave) : [[0,3,0],[0,13,2],[0,0,7]] → les 3 « Faible » sont classés « Moyen ».
- Importances : pluie 46,5 %, perméabilité 21,6 %, altitude 19 %, pente 7,4 %, drainage 5,5 %.
- Sous ~45 mm de pluie, le score est constant (aucun exemple d'entraînement) : garde-fou à 30 mm ajouté dans alertes/tasks.py.

## Mesure du LSTM refaite le 6 octobre 2026
- Résultat identique à celui du 3 octobre : LSTM MAE 8,01 cm, RMSE 11,52 cm ; persistance MAE 6,04 cm, RMSE 9,05 cm (modèle et données inchangés depuis le 9 septembre).
- Niveau d'eau moyen de la validation : 7,73 cm ; un seul jour sur 38 à 30 cm ou plus (LSTM : erreur de 33,3 cm ; persistance : 18,5 cm).

## LSTM réentraîné le 6 octobre 2026 (`ia/preparation_donnees.py`, `ia/modele_lstm.py`)
- 5 454 séquences (15 ans de pluie de Dakar), découpage chronologique 3 817 / 818 / 819 ; 5 variables dont la pluie du jour suivant ; niveau d'eau reconstitué (1,5 × cumul 72 h + bruit de 5 cm, graine fixée).
- Test (819 séquences, 42 jours à 30 cm ou plus) : LSTM MAE 2,82 cm, RMSE 3,84 ; persistance 4,97 / 10,07 ; règle empirique 4,69 / 8,97. Sur les jours à 30 cm ou plus : 6,56 contre 21,51 et 17,22 cm.
- Réserves : cible reconstituée, pluie prévue = pluie réelle à l'évaluation. Détail : `mbeund_mi_ia/data/metriques_lstm.json`.
