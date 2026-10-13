# Rapport PFF — contributions de Maïmouna SALL

Mode d'emploi : remplacez chaque consigne `> ...` par votre texte, **dans ce fichier**. Gardez les titres.
Brouillon avec les chiffres du 6 octobre dès maintenant ; **version finale le mardi 13 octobre 2026**. Maïmouna intègre le mercredi 14.
Lisez d'abord `docs/audit/ADAPTATION_RAPPORT_ISEP.md`. Écrivez au format Markdown simple : titres, paragraphes, listes, tableaux.

## Dédicace (3 à 6 lignes personnelles, signées)
Je rends avant tout grâce au Seigneur, Dieu Tout-Puissant, pour la vie, la santé, la force et la persévérance qu'Il m'a accordées tout au long de ce parcours de formation. Je dédie ce travail avec une profonde gratitude à toute ma famille. À mon père, El Hadji SALL, pour son soutien constant et inestimable tout au long de mon parcours scolaire, depuis le CI jusqu'à ce jour. À la mémoire de ma chère mère, Awa GAYE, pour son amour bienveillant et ses précieux conseils ; j'aurais tant aimé qu'elle partage cette nouvelle étape de ma vie, et je prie Allah de l'accueillir en Son paradis éternel. À mes frères et sœurs, mes cousins et à l'ensemble de mes proches pour leur présence rassurante et leurs encouragements.

*— Maïmouna SALL*

## 1.2.1 Origine du projet (0,5 page)
> Comment l'idée est née (inondations de Thiaroye-sur-Mer, enquête du 15 mai 2026), qui a proposé le sujet, comment l'encadreur l'a validé.

## Introduction : resserrer à 3 pages
> Proposer une version resserrée (décision D4 : questions de recherche et hypothèses).

## 3.4 Mise à jour du protocole d'expérimentation
> Forêt aléatoire de 300 arbres, calibration sigmoïde, validation temporelle en 3 plis, apprentissage 2010-2021, test 2022-2024, variables : pluie du jour, cumuls 24 h et 72 h. Données : `mbeund_mi_ia/data/metriques_rf.json`.

## 4 (introduction du chapitre, 3 lignes)
> Annoncer les cinq parties du chapitre 4.

## 4.1.1 Environnement de travail (0,5 page)
> Systèmes et versions (Python, Node, bibliothèques principales), organisation du dépôt, intégration continue.

## 4.1.4 Intelligence artificielle (1,5 page)
> Entraînement et intégration des modèles, détection satellite, météo, chatbot NDAM.

## 4.2.3 Scénario de démonstration (0,5 page)
> Pluie → prédiction → alerte → SMS → signalement → itinéraire.

## 4.3.2 Évaluation du modèle d'IA (1 page)
> Tableau : toujours « vert », persistance, forêt aléatoire, forêt calibrée, avec le F1 par classe. Reconnaître les limites : classes orange et rouge rares (10 et 3 cas), modèle calibré sans détection du niveau orange. Répondre aux hypothèses de l'introduction.

## Conclusion : rappel de la problématique (0,3 page) et bilan des objectifs (0,7 page)
> Tableau des objectifs spécifiques avec leur statut (atteint, partiellement atteint, non atteint) et une phrase de justification.

## Résumé et Abstract : phrase de résultats
> Une phrase en français, une en anglais, après le chapitre 4.

## Annexe : mesures détaillées de l'IA
> Matrices de confusion, F1 par classe, protocole.

## Apports du projet pour moi (conclusion, 3 à 4 lignes)
> Compétences techniques acquises et compétences transversales (travail en équipe, gestion du temps, communication).

## Bibliographie (format APA)
> Une référence par ligne : Auteur (année). *Titre*. Éditeur ou adresse. Pour les sites : date de consultation.

## Points surlignés du rapport dont je suis responsable
- **Introduction (Chiffre exact PDNA 2010) :** Environ **360 000 personnes touchées** et des dommages et pertes évalués à **104 millions de dollars américains** (environ 45 milliards FCFA).  
  *Source : Gouvernement du Sénégal, Banque Mondiale, Système des Nations Unies (2010), « Rapport d'évaluation des besoins post-catastrophe (PDNA) : inondations urbaines de Dakar 2009 ».*
- **Introduction (Taux de pénétration mobile ARTP) :** Taux de pénétration officiel de **127,15 %** au 1er trimestre 2024 (pour un parc de plus de 22 millions de lignes mobiles actives).  
  *Source : Autorité de Régulation des Télécommunications et des Postes (ARTP, 2024), « Observatoire de la téléphonie mobile au Sénégal : 1er trimestre 2024 ».*
- **Section 2.1.5 (SIG & PROGEP) :** « Projet de Gestion des Eaux Pluviales et d'adaptation au changement climatique » (**PROGEP**), période **2012 – 2019**, exécuté par l'Agence de Développement Municipal (**ADM**) avec le concours de la Banque mondiale.
- **Section 2.1.6 (Solutions en Afrique - FANFAR) :** Projet européen de prévision et d'alerte hydrologique pour l'Afrique de l'Ouest (**FANFAR**), période **2018 – 2021**, conduit en partenariat avec le Centre Régional **AGRHYMET** (CILSS) et l'Institut Météorologique et Hydrologique Suédois (**SMHI**).
- **Section 4.3.4 (Essai réel du 4 octobre 2026) :** Relevé instantané de **0,3 mm/h** et prévision sur 24h de **9,2 mm** via Open-Meteo. Classification confirmée au statut VERT (score 0,00 car inférieur au seuil d'activation de 15 mm).

## Relecture de la section d'une autre personne (jeudi 15 octobre)
> Section relue : …  Remarques : …
