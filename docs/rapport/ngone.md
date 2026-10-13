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
- **Performance de chargement et découpage applicatif :** L'intégration de modules cartographiques lourds (Leaflet) et de visualisations de données (Recharts) entraînait un ralentissement du chargement initial sur mobile. *Solution apportée :* Mise en œuvre du découpage du code (*lazy-loading*) via React Suspense et les chunks dynamiques de Vite.
- **Gestion des formulaires citoyens et accessibilité :** Faciliter la prise de photo et l'envoi rapide d'un signalement d'inondation en situation d'urgence. *Solution apportée :* Formulaire allégé avec capture photo directe, validation instantanée des coordonnées GPS et respect des contrastes WCAG.
- **Diffusion temps réel des alertes :** Assurer la réception instantanée des alertes d'urgence sur les interfaces sans rafraîchissement manuel de la page. *Solution apportée :* Connexion WebSocket bidirectionnelle avec gestion robuste des déconnexions et reconnexions automatiques.

## Annexe : captures des autres écrans
Les captures d'écran complémentaires de l'application (espace d'administration des capteurs, formulaires détaillés, variantes mobile en mode sombre/clair) sont classées dans le dossier `docs/rapport/captures/` pour insertion en annexe.

## Apports du projet pour moi (conclusion, 3 à 4 lignes)
Sur le plan technique, ce projet m'a permis de consolider la conception d'architectures web modernes et réactives sous React 18, l'intégration de cartographies interactives avec Leaflet et la mise en œuvre de tests automatisés avec Vitest. Sur le plan transversal, cette expérience a renforcé mes compétences en travail d'équipe agile, en rigueur de planification et en communication technique collaborative.

## Bibliographie (format APA)
- Meta Open Source. (2024). *React – A JavaScript library for building user interfaces* (v18.3). https://react.dev (consulté le 10 octobre 2026).
- Vite. (2024). *Next Generation Frontend Tooling*. https://vitejs.dev (consulté le 10 octobre 2026).
- Agafonkin, V. (2023). *Leaflet: an open-source JavaScript library for mobile-friendly interactive maps* (v1.9.4). https://leafletjs.com (consulté le 10 octobre 2026).
- Vitest. (2024). *Blazing Fast Unit Test Framework*. https://vitest.dev (consulté le 10 octobre 2026).
- World Wide Web Consortium (W3C). (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/ (consulté le 8 octobre 2026).

## Points surlignés du rapport dont je suis responsable
- **Superficie et population de Thiaroye-sur-Mer (Chapitre 1, section 1.2.2) :**  
  Superficie officielle : **3,8 km²**. Population estimée : **plus de 62 000 habitants** en 2023, avec une densité démographique excédant **16 000 hab./km²**.  
  *Sources : Agence Nationale de la Statistique et de la Démographie (ANSD) et Services techniques de la Mairie de Thiaroye-sur-Mer.*
- **Effectif exact de la population sénégalaise (Chapitre 2, section 2.1.3) :**  
  Effectif national officiel : **18 032 473 habitants** répartis sur une superficie de **196 722 km²**.  
  *Source : ANSD, Rapport définitif du cinquième Recensement Général de la Population et de l'Habitat (RGPH-5, 2023).*
- **Population de Dakar et part nationale (Chapitre 2, section 2.1.3) :**  
  Population de la région de Dakar : **3 896 564 habitants**, soit **21,6 % de la population nationale** concentrée sur seulement **547 km²** (**0,28 % du territoire national**).  
  *Source : ANSD, RGPH-5 (2023).*
- **Liste officielle des quartiers à risque (Chapitre 1, section 1.2.2) :**  
  Thiaroye Gare, Camp Militaire, Thiaroye-sur-Mer Village/Côtier, CEM Thiaroye 44, Djida Thiaroye Kaw, Médina Fass, Darou Salam, Santhiaba.  
  *Sources : Services techniques municipaux de Thiaroye-sur-Mer et enquête de terrain du 15 mai 2026.*

## Relecture de la section d'une autre personne (jeudi 15 octobre)
> Section relue : …  Remarques : …
