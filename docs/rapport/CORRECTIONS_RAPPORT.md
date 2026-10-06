# Rapport v4 : ce qui a été repris, corrigé, retiré et reste à vérifier

Fichier : `rapport_pff/Rapport_PFF_MBEUND_MI_v4.docx` (et sa version PDF), 65 pages. **Le document contient 18 commentaires Word** (auteur « Claude ») ancrés sur les titres des passages modifiés : chacun résume ce qui a changé et pourquoi.
Source du contenu : `Rapport_PFF_MBEUND_MI.docx` (le rapport des auteures). Format : page de garde, plan et table des matières du modèle ISEP-AT n° 2 (« Page de garde, plan et sommaire »).

## 1. Ce qui a été fait

- **Page de garde du modèle n° 2**, avec le **drapeau du Sénégal** et le **logo de l'ISEP-AT** côte à côte, en évidence sous l'en-tête officiel. Département TIC et métier APD sont repris du modèle.
- **Plan officiel** : Introduction, quatre chapitres, conclusion et perspectives, bibliographie APA, annexes, table des matières détaillée. Le sommaire est à deux niveaux.
- **Tout le contenu du rapport a été repris** : introduction, anciens chapitres I à III (redistribués dans les chapitres 1 à 3), dédicaces, remerciements, sigles, tableaux, 9 figures, bibliographie. Contrôle : les 325 cellules de tableaux et les 9 figures du fichier d'origine sont présentes.
- **Renvois renumérotés** : les « chapitre IV » deviennent « chapitre 4 », et les renvois aux figures et tableaux suivent le nouvel ordre.
- **Chapitre 4 reconstruit** autour du plan officiel (4.1 à 4.5). La partie descriptive de l'ancien chapitre IV est conservée ; la partie « résultats » est reprise avec les valeurs mesurées.
- **4.2.3 rédigé** à partir du script de démonstration : les trois scénarios ont été rejoués avec le vrai service IA (`rapport_pff/sources/mesures/rejeu_scenarios.py`).
- **1.2.1 rédigé** d'après le récit des auteures (quartiers touchés, Grand Yoff, Thiaroye-sur-Mer en 2025, inondations depuis les années 1990).
- **Mesure du LSTM refaite le 6 octobre 2026** : résultat identique (MAE 8,0 cm contre 6,0 cm pour la référence naïve), le modèle et les données n'ayant pas changé depuis le 9 septembre. Un seul des 38 jours de validation dépasse 30 cm : mesure fragile.
- **Annexe 5 ajoutée** : mesures détaillées du modèle de risque (protocole, matrices de confusion).
- **Résumé et abstract resserrés** à environ 224 mots (390 auparavant).

## 2. Corrections faites (valeur du fichier d'origine → valeur retenue)

Chaque ligne a été vérifiée dans le code ou dans les mesures du dépôt.

| Où | Le fichier disait | Valeur retenue | Preuve |
|---|---|---|---|
| Résumé, abstract, conclusion | Exactitude de 87,4 %, erreur LSTM de 4,2 cm, −38 % d'exposition, 153 tests, couverture 82,1 %, « test in-situ » | Exactitude 93,5 % (95,3 % calibré), F1 macro 0,54 (0,48) ; LSTM 8,0 cm contre 6,0 cm pour la référence naïve ; 304 tests, couverture backend 78 % ; aucun chiffre sur les −38 % | `mbeund_mi_ia/data/metriques_rf.json` ; `rapport_pff/sources/mesures/RESULTATS.md` ; pytest du 6 oct. |
| Mots-clés | 9 | 6 | Le plan impose 4 à 6 |
| 4.1.3 Zones | Guinaw Rail, Route de Rufisque, Ibra Ndoye, Mbatal, Cité Sam-Sam, Médina Fass… | Thiaroye Gare, Camp Militaire, Thiaroye sur Mer, CEM Thiaroye 44, Djida Thiaroye Kaw, Pikine Zone, Zone Côtière Yoff | `backend/alertes/topographie_thiaroye.csv` |
| 4.1.3 Topographie | Altitude 4,8 à 7,2 m, pente 0,32 à 0,65 %, perméabilité 30 à 65, nappe de 0,5 à 1,8 m | Altitude 0,1 à 9,4 m, pente 0,20 à 1,49 %, perméabilité 10 à 65 %, drainage de « Bon » à « Très mauvais » ; la profondeur de nappe n'est pas dans le fichier | même fichier |
| 4.1.3 Signalement | Hauteur d'eau choisie : cheville, mollet, genou, taille | Niveau d'eau estimé par analyse de la photo (indéterminé, faible, modéré, élevé) ; position limitée à 4 km | `alertes/models.py`, `api/services/vision_service.py` |
| 4.1.3 Anomalies | Fichier `detection_anomalies.py`, drapeau `is_anomaly` | `detecteur_anomalies.py`, action « EXCLURE_DU_CALCUL », règles sur les valeurs négatives et supérieures à 500 cm | `mbeund_mi_ia/ia/detecteur_anomalies.py` |
| 4.1.4 Random Forest | 50 arbres, calibration isotonique, 2010-2024, variables d'altitude, pente, perméabilité, drainage ; Brier de 0,162 à 0,084 | 300 arbres, calibration sigmoïde avec validation temporelle en 3 plis, apprentissage 2010-2021 et test 2022-2024, trois variables de pluie (jour, 24 h, 72 h) ; Brier non recalculé | `metriques_rf.json` |
| 4.1.4 Seuil de pluie | 30 mm | **15 mm** | `backend/alertes/tasks.py`, ligne 30 |
| 4.1.4 LSTM | Activation ReLU sur la couche LSTM ; 100 époques avec arrêt précoce ; MAE 4,2 cm, RMSE 5,8 cm, R² 0,891 | Pas d'activation ReLU sur la couche LSTM ; script d'entraînement de 5 époques ; MAE 8,0 cm, RMSE 11,5 cm (mesure du 3 octobre), moins bon que la référence naïve (6,0 cm) | `ia/modele_lstm.py` ; `mesures/RESULTATS.md` |
| 4.1.4 NDWI | Seuil NDWI > 0,1 | Seuil **0,3** | `mbeund_mi_ia/gee/config_gee.py` |
| 4.3.3 Détection satellite | Concordance Kappa de 0,81 avec les polygones de l'ONAS et du PDNA de 2020 et 2022 | Aucune validation quantitative n'a été faite : texte remplacé | Aucun code ni mesure dans le dépôt |
| 4.1.5 Itinéraire | Pénalité proportionnelle à la hauteur d'eau, coût infini en cas de danger | Coût = longueur × (1 + 5 × score de risque) : au maximum six fois la longueur | `api/services/routing_service.py` |
| 4.1.5 Chatbot | Llama 3.3 70B, 0,4 s, « wolof phonétique » | Modèle `gpt-oss-120b` sur Groq ; temps non mesuré ; le module de recommandations produit des messages en wolof | `mbeund_mi_ia/ia/service_chatbot.py` |
| 4.1.5 PDF | « Logo officiel de la commune » | Logo et charte graphique de MBEUND MI | `api/services/pdf_export_service.py` |
| 4.2.1 Interface citoyenne | Bouton flottant, hauteur d'eau avec repères anatomiques, bandeau d'urgence en alerte rouge, « 90 % de smartphones » | Écran « Signaler » (position, description, photo) ; itinéraire proposé depuis l'écran « Carte » ; le chiffre de 90 % n'a pas de source : retiré | `src/citizen/pages/` |
| 4.2.2 Console des autorités | 6 indicateurs, dont l'état des motopompes et le remplissage des bassins | 4 indicateurs réels : zones à risque élevé, prédiction à 24 h, score de risque moyen, alertes émises ; aucune donnée sur les motopompes ni les bassins | `src/autorite/pages/TableauDeBordPage.jsx` |
| 4.3.1 Tests | 153 tests backend, 31 tests Vitest, couverture 82,1 % | 228 (backend), 37 (IA, dont 26 nouveaux sur le service de prédiction), 39 (interface), soit 304 ; couverture backend 78 % | Exécution du 6 octobre 2026 |
| 4.3.4 Essai du 4 octobre | « Validation in-situ en conditions réelles » | « Essai de la chaîne » sur des prévisions réelles ; marqueurs jaunes sur les valeurs à confirmer | Pas d'inondation ni de capteur ce jour-là |
| 4.3.5 Hypothèses | Trois hypothèses (H1, H2, H3) toutes « CONFIRMÉE », différentes de celles de l'introduction | Les quatre hypothèses H1 à H4 de l'introduction, avec une conclusion honnête pour chacune | Tableau 1 de l'introduction |
| Conclusion | « validé », « capacité inédite », « système autonome », « garantissant que l'alerte parvienne à chaque chef de famille », « technologie souveraine » | Formulations ramenées à ce qui est démontré | — |
| Perspectives | « Évolution vers MBEUND BI » | « Extension à la planification urbaine » (le nom du projet est MBEUND MI) | — |
| 4.1.2 (ancien III) | « 50 arbres, isotonique, 80/20, 123 tests » | Valeurs actuelles (voir plus haut) ; 304 tests | `metriques_rf.json` |
| Introduction | PDNA 2010 : 360 000 sinistrés dans la région de Dakar, 44,5 milliards de FCFA | Environ 360 000 personnes touchées, **104 millions de dollars** (56 de dommages, 48 de pertes), dont 82 millions pour les zones périurbaines de Dakar | [GFDRR, PDNA Sénégal 2009](https://www.gfdrr.org/en/senegal-2009-pdna-undertaken-after-2009-flooding) |
| Introduction | Pénétration mobile supérieure à 118 % en 2024 | **127 %** au premier trimestre 2024 (118 % date du troisième trimestre 2021) | ARTP, via [Osiris](https://www.osiris.sn) ; rapport ARTP à citer directement |
| 2.1.3 | Région de Dakar : 4 011 027 habitants (22,2 %) ; « résultats définitifs » | **3 896 564 habitants (environ 21,6 %)**, chiffre retenu par les auteures ; d'autres publications de l'ANSD donnent 4 004 425 | [ANSD](https://www.ansd.sn) |
| 2.1.5 et bibliographie | PROGEP : projet P122756, 2012-2020 | Projet **P122841**, 2012-2019 | Banque mondiale (PROGEP) |
| 2.1.6 | FANFAR (2018-2022) | **2018-2021** | [SMHI](https://www.smhi.se/en/research/research-news/smhi-creates-flood-warning-system-in-west-africa-1.139523) |
| Annexe 2 | Dictionnaire avec des tables et champs inexistants (`api_signalementcitoyen`, `geom`, `hauteur_eau`) | **Régénéré** à partir des modèles Django actuels ; les descriptions d'origine sont reprises quand le champ existe encore | Modèles Django |
| Annexe 3 | URL en `/api/v1/...` (inexistantes) | **URL réelles** de `backend/api/urls.py` | `api/urls.py` |
| Annexe 4 | Trois extraits de code qui ne correspondent pas au dépôt | **Trois extraits réels** lus dans les fichiers, avec chemin et numéros de lignes | Dépôt |
| Annexe 1 | Tableau en double | Un seul exemplaire | — |
| Bibliographie | Pas d'entrée pour l'ARTP | Entrée ARTP ajoutée (adresse et date à compléter) | — |

## 3. Affirmations retirées parce qu'aucune mesure n'existe

Latence réseau inférieure à 120 ms ; requêtes spatiales sous 15 ms ; réponse du chatbot en 0,4 s ; certification d'un signalement en moins de 3 minutes ; SMS reçus en 4 à 8 secondes sur téléphone basique ; « tests de charge » ; réduction de 38 % de l'exposition aux axes inondés. Si l'équipe réalise ces mesures, les valeurs pourront être ajoutées.

## 4. Points d'honnêteté ajoutés dans le rapport

- Les capteurs sont **simulés** ; l'écoute des capteurs n'est pas démarrée en production.
- L'envoi **réel de SMS au Sénégal n'est pas validé** (identifiants Orange en attente).
- Les tâches planifiées doivent encore être déclenchées en production (tâche R02 du plan de travail).
- Le modèle de classification **ne fait pas mieux qu'une règle de persistance** sur le F1 macro ; les niveaux orange et rouge sont mal détectés (10 et 3 jours dans le jeu de test).
- Le LSTM **ne dépasse pas la référence naïve** (mesure du 3 octobre, à refaire).
- Les hypothèses ne sont **pas vérifiées empiriquement** : faisabilité démontrée, effet non mesuré.

## 5. À vérifier par l'équipe (non vérifiable depuis le dépôt)

Ces éléments ont été ajoutés dans le fichier d'origine à la place de marqueurs « à vérifier » ; ils sont conservés, mais **chaque auteur doit les confronter à la source** :

| Où | Élément |
|---|---|
| 2.1.3 | 18 032 473 habitants (RGPH-5, confirmé par la recherche) ; Dakar : 0,28 % du territoire (confirmé) ; 3 896 564 habitants pour la région de Dakar (choix des auteures) |
| 1.2.2 | Commune de 3,8 km², plus de 62 000 habitants, densité supérieure à 16 000 hab./km² ; relevés SRTM et ADM |
| 1.2.2 | Nappe : 10 à 15 cm de remontée par an (DGPRE) ; bâti de 27 % à 88 % entre 1978 et 2012 (CSE, 2013) |
| 2.1.3 | « Fall et al., 2014 » et « OMS, 2021 » : cités dans le texte, **absents de la bibliographie** |
| 1.1 | ISEP créé par décret en 2018, implanté à Thiès et Diamniadio |
| Bibliographie | Toutes les dates de consultation et le numéro du projet PROGEP (P122756) |
| 2.1.4 | Marqueur restant : « intitulé actuel à vérifier » |

## 6. Marqueurs jaunes restants (29 dans le document)

À traiter par l'équipe :

| Responsable | Éléments |
|---|---|
| Équipe | 2.2 renvois ; 2.4 solutions envisagées (tableau comparatif) ; 2.5 diagramme de Gantt ; outil de communication du groupe |
| Ngoné | 4.2 : captures d'écran des écrans citoyens et autorité |
| Maïmouna | Refaire les simulations de seuils du 4 octobre (seuil de 15 mm) |
| Mama Adam | 4.1.5 planification des tâches en production ; 4.4 coûts ; vérifier le journal d'exécution du 4 octobre |
| Mame Diarra | Source du fichier de topographie ; mesure éventuelle du temps des requêtes spatiales ; descriptions de l'annexe 2 (tâche R28) |
| Chacun | Dates de consultation de la bibliographie ; validation du tableau des difficultés (4.5) |

## 7. Autres remarques de forme

- **Introduction** : 4 pages pour 2 à 3 attendues (non resserrée : le texte est celui des auteures) ; **chapitre 2** : 11 pages pour 6 à 8 ; **conclusion** : 4 pages pour 1 à 2.
- **Titre de la page de garde** raccourci à deux lignes comme l'impose le modèle : « MBEUND MI : plateforme intelligente de prévention des inondations à Thiaroye-sur-Mer ». À faire valider par l'encadreur.
- **Année académique** : 2025 – 2026, comme le modèle.
- **Police** : la page de garde utilise Century Gothic ; pour imprimer, utiliser le PDF fourni.
