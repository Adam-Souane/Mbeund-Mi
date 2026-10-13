# Rapport PFF — contributions de Ngoné GUEYE

Mode d'emploi : remplacez chaque consigne `> ...` par votre texte, **dans ce fichier**. Gardez les titres.
Brouillon avec les chiffres du 6 octobre dès maintenant ; **version finale le mardi 13 octobre 2026**. Maïmouna intègre le mercredi 14.
Lisez d'abord `docs/audit/ADAPTATION_RAPPORT_ISEP.md`. Écrivez au format Markdown simple : titres, paragraphes, listes, tableaux.

## Dédicace (3 à 6 lignes personnelles, signées)
> À écrire.

## 2.1.1 et 2.1.2 : version condensée (2 pages au total)
> « Les inondations urbaines et côtières » et « La GRC et les systèmes d'alerte précoce » : proposer ici le texte raccourci ; Maïmouna le remplacera dans le rapport.

## 2.2 Critique de l'existant : compléter
> Relier chacune des quatre limites à un passage de la section 2.1 (renvois), ajouter les limites propres à notre démarche (0,5 page).

## 4.1.5 Frontend (1,5 page)
L'architecture frontend repose sur React 18, Vite, React Router 7 et TailwindCSS. L'application est découpée en deux espaces étanches : l'espace citoyen (mobile-first, 6 écrans) et l'espace autorité/supervision (desktop-first, 15 écrans).
Pour maximiser les performances de chargement initial, l'ensemble des modules lourds (Leaflet pour la cartographie interactive, Recharts pour les graphiques analytiques, TanStack Query pour la gestion du cache de données) sont chargés de manière différée (*lazy loading* par découpage des bundles Vite).
L'interface prend en charge le mode sombre automatique (thème clair/sombre), le respect strict des critères d'accessibilité ARIA/WCAG, et intègre une suite de 84 tests d'intégration Vitest avec couverture de code v8 supérieure à 50 %.

## 4.2.1 Espace citoyen : captures (1,5 page)
L'espace citoyen regroupe 6 écrans clés :
1. **Accueil Citoyen :** Synthèse du niveau de risque dans le quartier du riverain, raccourcis d'action d'urgence et widget météo.
2. **Carte Interactive Citoyenne :** Géolocalisation des zones inondables, repères d'évacuation et refuges d'urgence.
3. **Prévisions & Alertes :** Fil chronologique des bulletins de vigilance météorologique et notifications en temps réel.
4. **Signalement Terrain avec Photo :** Formulaire simplifié d'envoi d'observations géolocalisées avec prise de photo directe.
5. **Profil & Paramètres :** Gestion des informations personnelles, canal de notification préféré (SMS, WhatsApp, Push) et langue.
6. **Assistant Virtuel Chatbot NDAM :** Interface conversationnelle guidant le citoyen sur la conduite à tenir en cas de crue.

## 4.2.2 Espace autorité : captures (1,5 page)
L'espace de supervision autorité offre 15 écrans dédiés à la gestion des risques :
1. **Tableau de Bord :** Supervision temps réel des indicateurs clés (score de risque moyen, prédictions IA 24h, alertes récentes).
2. **Carte Interactive Autorité :** Couches PostGIS, débit des canalisations, télémesure des capteurs IoT et découpage par quartier.
3. **Signalements Terrain :** Console de modération des alertes riverains avec détection automatique des doublons par vision IA.
4. **Gestion de Crise :** Salle de commandement pour déclencher et diffuser des alertes SMS / WebSocket d'urgence.
5. **Fiabilité & Performance du Modèle :** Métriques d'évaluation de l'IA (Random Forest & LSTM), courbe ROC-AUC et matrice de confusion.
6. **Exports :** Module d'extraction des jeux de données et rapports réglementaires au format CSV et PDF.

## 4.3.3 Scénario manuel de bout en bout (0,5 page)
Le scénario de test de bout en bout simule l'ensemble du cycle de vie d'une alerte d'inondation :
- **Inscription & OTP :** Création du compte citoyen (`+221771234567`), réception et validation du code OTP à 6 chiffres.
- **Signalement terrain :** Prise de photo et envoi d'un signalement d'inondation pour le quartier Thiaroye Gare.
- **Modération Autorité :** Validation du signalement par l'agent de supervision et diffusion d'une alerte ROUGE.
- **Réception Temps Réel :** Notification et affichage instantané de la consigne de sécurité sur le mobile du citoyen via WebSocket.
Toutes les 5 étapes du scénario ont été exécutées et validées sur la base de démonstration.


## 4.5 Difficultés : valider les lignes « frontend »
> Corriger ou compléter les lignes du tableau.

## Annexe : captures des autres écrans
> Les écrans non retenus en 4.2.

## Apports du projet pour moi (conclusion, 3 à 4 lignes)
> Compétences techniques acquises et compétences transversales (travail en équipe, gestion du temps, communication).

## Bibliographie (format APA)
> Une référence par ligne : Auteur (année). *Titre*. Éditeur ou adresse. Pour les sites : date de consultation.

## Points surlignés du rapport dont je suis responsable
- Chapitres 1 et 2 : « À COMPLÉTER : superficie et population, ANSD et mairie », « À VÉRIFIER : effectif exact, ANSD, RGPH-5, 2023 », « À COMPLÉTER : population et part nationale », « À COMPLÉTER : liste officielle des quartiers … »
> Pour chacun : la valeur exacte et sa source.

## Relecture de la section d'une autre personne (jeudi 15 octobre)
> Section relue : …  Remarques : …
