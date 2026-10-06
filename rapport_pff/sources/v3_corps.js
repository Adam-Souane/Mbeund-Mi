// Corps du rapport v3 : plan officiel de l'ISEP-AT (introduction, chapitres 1 à 4, conclusion).
// Les sections déjà rédigées (anciens chapitres I, II, III) sont redistribuées automatiquement
// par titre ; les parties nouvelles sont des squelettes avec des consignes surlignées [[...]].
module.exports = (h) => {
  const { H1, H2, H3, H4, P, B, figure, tableBlock, tag, intro, chap1, chap2, chap3 } = h;

  // --- redistribution des anciennes sections par titre ---------------------------------
  const groups = (arr) => {
    const g = [{ t: '', items: [] }];
    for (const e of arr) {
      if (e && e._h) g.push({ t: e._h.t, items: [] });
      else g[g.length - 1].items.push(e);
    }
    return g;
  };
  const pick = (g, prefix) => {
    const f = g.find((x) => x.t.startsWith(prefix));
    if (!f) throw new Error('Section introuvable : ' + prefix);
    return f.items;
  };
  const g1 = groups(chap1), g2 = groups(chap2), g3 = groups(chap3);
  const TODO = (t) => P('[[' + t + ']]');

  // ============================ INTRODUCTION ============================
  const corpsIntro = intro;

  // ============================ CHAPITRE 1 ============================
  const ch1 = [
    H1('CHAPITRE 1 : PRÉSENTATION DU CADRE DU PROJET'),
    P("Ce chapitre présente le cadre dans lequel s'inscrit le projet : l'établissement qui l'accueille, le projet MBEUND MI lui-même (origine, bénéficiaires, périmètre) et l'organisation du groupe qui l'a réalisé."),

    H2("1.1 Présentation de la structure d'accueil : l'ISEP Amadou Traware"),
    P("Les Instituts Supérieurs d'Enseignement Professionnel (ISEP) forment un réseau d'établissements publics d'enseignement supérieur créé par l'État du Sénégal pour proposer des formations professionnalisantes courtes, ancrées dans les besoins des territoires et du marché de l'emploi. Ces formations sont sanctionnées par le Diplôme de l'Institut Supérieur d'Enseignement Professionnel (DISEP)."),
    P("Le Projet de Fin de Formation (PFF) constitue l'exercice de synthèse du cursus. Il amène les étudiants à mobiliser l'ensemble des compétences acquises (analyse de données, développement web, conduite de projet, communication) pour répondre à un problème réel, puis à rendre compte de leur démarche dans un rapport soutenu devant un jury. MBEUND MI est un projet interne à l'établissement : il n'a pas de commanditaire extérieur."),
    TODO("À COMPLÉTER PAR L'ÉQUIPE (≈ 1 page) : historique de l'ISEP Amadou Traware (date de création, localisation à Diamniadio), missions, organigramme simplifié, présentation de la filière Analyse de Performance Digital (APD)"),

    H2('1.2 Présentation du projet MBEUND MI'),
    H3('1.2.1 Origine du projet'),
    TODO("À RÉDIGER PAR L'ÉQUIPE (≈ 0,5 page) : comment l'idée est née (inondations récurrentes de Thiaroye-sur-Mer, enquête de terrain du 15 mai 2026), qui a proposé le sujet et comment l'encadreur l'a validé"),
    H3('1.2.2 La commune de Thiaroye-sur-Mer et ses quartiers à risque'),
    ...pick(g2, 'Sous-section 1 : Présentation de la commune'),
    H3('1.2.3 Causes et conséquences des inondations : les constats de terrain'),
    ...pick(g2, 'Sous-section 2 : Analyse des causes'),
    H3('1.2.4 Bénéficiaires et périmètre'),
    P("Le projet s'adresse à trois catégories d'acteurs. Les **habitants** de Thiaroye-sur-Mer reçoivent des alertes par notification et par SMS, consultent la carte des risques et des points de refuge, signalent un problème par l'application ou par SMS et obtiennent un itinéraire d'évacuation. Les **autorités locales**, comptes habilités créés par un administrateur, disposent d'un tableau de bord, des prédictions, de la gestion de crise et des exports. Les **relais de quartier**, habitants volontaires, aident à vérifier les signalements de leur quartier."),
    P("Le **périmètre** est la commune de Thiaroye-sur-Mer : un signalement situé à plus de 4 km du centre de la commune est refusé (géorepérage). La plateforme est un outil d'aide à la décision et à l'information ; elle ne se substitue pas aux dispositifs officiels de protection civile. [[À valider par l'équipe]]"),

    H2("1.3 Organisation du groupe"),
    P("Le projet a été conduit en équipe de quatre étudiantes et étudiants, chacun responsable d'un domaine, avec une branche de travail par fonctionnalité et une intégration continue qui vérifie chaque modification."),
    ...tableBlock('Tableau', 'Répartition des rôles au sein du groupe',
      ['Membre', 'Rôle', 'Contribution principale'],
      [
        ['Maïmouna SALL', "Coordination et intelligence artificielle", "Modèles de prédiction (Random Forest, LSTM), détection satellite, météo, chatbot NDAM, intégration de l'ensemble"],
        ['Mama Adam SOUANE', 'Backend et infrastructure', "API REST (Django REST Framework), authentification, WebSocket, tâches planifiées, déploiement"],
        ['Mame Diarra DIANE', 'Base de données', "Modèle de données PostgreSQL/PostGIS, triggers, jeux de données de démonstration"],
        ['Ngoné GUEYE', 'Frontend', "Interfaces citoyen et autorité (React, Leaflet), accessibilité, tests de l'interface"],
      ], [2100, 2300, 4670], "dossier interne du projet. [[À vérifier par l'équipe]]"),
    ...tableBlock('Tableau', 'Outils de travail collaboratif et services utilisés',
      ['Besoin', 'Outil ou service'],
      [
        ['Gestion de versions', 'Git et GitHub (une branche par fonctionnalité)'],
        ['Intégration continue', 'GitHub Actions : ESLint, Vitest, Ruff, pytest et compilation du frontend'],
        ['Hébergement du serveur', 'Render'],
        ['Base de données', 'Neon (PostgreSQL avec PostGIS)'],
        ['Cache et file de tâches', 'Upstash (Redis)'],
        ['Capteurs (messagerie MQTT)', 'HiveMQ Cloud'],
        ['Communication au sein du groupe', '[[À compléter]]'],
      ], [3200, 5870], 'fichier docs/DEPLOIEMENT.md du dépôt'),
  ];

  // ============================ CHAPITRE 2 ============================
  const ch2 = [
    H1("CHAPITRE 2 : ANALYSE DE L'EXISTANT ET CADRAGE"),
    P("Ce chapitre décrit comment le besoin est traité aujourd'hui, en montre les limites, puis cadre la solution : besoins, solution retenue et planification du travail."),

    H2("2.1 Étude de l'existant"),
    P("Cette section rassemble les notions de base, la situation nationale, le cadre institutionnel et les outils numériques existants. [[À condenser par l'équipe : le plan officiel prévoit 6 à 8 pages pour tout le chapitre 2]]"),
    H3('2.1.1 Les inondations urbaines et côtières : définitions et typologie'),
    ...pick(g1, 'Sous-section 1 : Les inondations urbaines'),
    H3("2.1.2 La gestion des risques de catastrophes et les systèmes d'alerte précoce"),
    ...pick(g1, 'Sous-section 2 : La gestion des risques'),
    H3('2.1.3 Les inondations au Sénégal'),
    ...pick(g2, 'Sous-section 1 : Présentation du Sénégal'),
    H3('2.1.4 Le cadre institutionnel sénégalais'),
    ...pick(g2, 'Sous-section 2 : Cadre institutionnel'),
    H3("2.1.5 Les systèmes d'information géographique appliqués aux inondations"),
    ...pick(g1, "Sous-section 1 : Les systèmes d'information"),
    H3('2.1.6 Les solutions numériques existantes en Afrique'),
    ...pick(g1, 'Sous-section 2 : Solutions numériques'),

    H2("2.2 Critique de l'existant"),
    P("L'étude de l'existant fait apparaître quatre limites, qui fondent le besoin :"),
    B("**Des alertes trop larges.** Les alertes disponibles sont nationales ou régionales ; elles ne permettent pas d'anticiper la situation à l'échelle d'un quartier."),
    B("**Un maillon local faible.** Le cadre institutionnel est riche mais fragmenté ; son maillon le plus fragile est le niveau local."),
    B("**Des solutions numériques orientées vers d'autres problèmes.** Les outils existants en Afrique traitent surtout les crues fluviales à grande échelle, pas les inondations pluviales, phréatiques et côtières d'une commune littorale."),
    B("**Des habitants mobilisés mais peu outillés.** L'enquête de terrain montre des habitants qui trouvent eux-mêmes des solutions, sans outil de signalement ni d'information en temps réel."),
    TODO("À COMPLÉTER PAR L'ÉQUIPE : relier chaque limite à un passage de la section 2.1 (renvois), et ajouter si besoin les limites propres à notre démarche"),

    H2('2.3 Expression des besoins'),
    ...pick(g3, 'Sous-section 1 : Spécification'),

    H2('2.4 Solutions envisagées et justification du choix retenu'),
    TODO("À RÉDIGER PAR L'ÉQUIPE (≈ 1 page) : comparer au moins trois solutions possibles (par exemple : alertes par SMS seules ; application mobile native ; plateforme web et mobile avec prévision par intelligence artificielle, qui est la solution retenue) dans un tableau de critères (couverture des besoins de la section 2.3, coût, maintenance, accessibilité) et justifier le choix"),

    H2('2.5 Planification du projet'),
    P("Le projet s'est déroulé de mai à octobre 2026. Le tableau suivant en retrace les jalons principaux, reconstitués à partir de l'historique du dépôt de code."),
    ...tableBlock('Tableau', 'Jalons du projet',
      ['Période', 'Jalon'],
      [
        ['15 mai 2026', 'Enquête de terrain à Thiaroye-sur-Mer'],
        ['Début juin 2026', 'Création du dépôt ; premières briques d\'intelligence artificielle et chatbot NDAM'],
        ['Août 2026', 'Backend : modèles, API, authentification, WebSocket, tâches planifiées, réception des capteurs (tâches B01 à B15)'],
        ['Début septembre 2026', 'Base de données PostGIS, services météo et SMS'],
        ['Mi-septembre 2026', 'Chaîne mesure → prédiction → alerte → SMS ; reconstruction du frontend ; routage d\'évacuation'],
        ['Fin septembre 2026', 'Comptes citoyens et autorités, authentification par code (OTP), notifications temps réel, déploiement'],
        ['Début octobre 2026', 'Audit de qualité et de sécurité, correction des anomalies, intégration continue, tests'],
        ['6 au 20 octobre 2026', 'Finalisation du code, audits par membre, rédaction du rapport, préparation de la soutenance'],
      ], [2600, 6470], "historique Git du dépôt. [[À valider par l'équipe]]"),
    TODO("À FAIRE PAR L'ÉQUIPE : diagramme de Gantt (figure) reprenant ces jalons avec la répartition des tâches par membre ; à produire dans un tableur ou un outil de planification, puis à exporter en image"),
  ];

  // ============================ CHAPITRE 3 ============================
  const ch3 = [
    H1('CHAPITRE 3 : CONCEPTION DE LA SOLUTION'),
    P("Ce chapitre décrit le passage du besoin à la solution : la démarche de conception, l'architecture et les choix technologiques, la modélisation détaillée, puis le protocole d'expérimentation du module d'intelligence artificielle. Les éléments présentés sont tirés du code source de la plateforme."),

    H2('3.1 Démarche de conception'),
    ...pick(g3, 'Sous-section 2 : Étude et choix'),
    H2('3.2 Architecture générale et choix technologiques'),
    ...pick(g3, 'Sous-section 1 : Choix technologiques'),
    H2('3.3 Modélisation détaillée'),
    ...pick(g3, 'Sous-section 3 : Modélisation'),
    H2("3.4 Protocole d'expérimentation du module d'intelligence artificielle"),
    TODO("MISE À JOUR OBLIGATOIRE (Maïmouna, Mama Adam) : le texte ci-dessous date d'avant les corrections d'octobre. Valeurs actuelles : forêt aléatoire de 300 arbres, calibration sigmoïde avec validation temporelle en 3 plis, apprentissage sur 2010-2021 et test sur 2022-2024, variables d'entrée = pluie du jour et cumuls sur 24 h et 72 h ; tests automatisés = 228 (backend), 11 (IA), 39 (frontend)"),
    ...pick(g3, "Sous-section 2 : Description de l'expérimentation"),
  ];

  // ============================ CHAPITRE 4 ============================
  const ch4 = [
    H1('CHAPITRE 4 : RÉALISATION, TESTS ET RÉSULTATS'),
    TODO("À RÉDIGER (3 lignes) par Maïmouna à l'intégration : annoncer les cinq parties du chapitre. Volume visé : 8 à 12 pages"),

    H2('4.1 Mise en œuvre'),
    H3('4.1.1 Environnement de travail'),
    TODO("MAÏMOUNA (≈ 0,5 page) : systèmes et versions utilisés (Python, Node, bibliothèques principales), organisation du dépôt, intégration continue"),
    H3('4.1.2 Base de données'),
    TODO("MAME DIARRA (≈ 1 page) : mise en œuvre de PostgreSQL/PostGIS sur Neon, migrations, index sur les mesures, jeu de données de démonstration ; mesures avant/après des index"),
    H3('4.1.3 Backend et déploiement'),
    TODO("MAMA ADAM (≈ 1,5 page) : API, authentification et codes OTP, WebSocket, tâches planifiées, sécurité, déploiement sur Render ; chiffres de l'audit (228 tests, couverture 78 %)"),
    H3("4.1.4 Intelligence artificielle"),
    TODO("MAÏMOUNA (≈ 1,5 page) : entraînement et intégration des modèles, détection satellite, météo, chatbot NDAM"),
    H3('4.1.5 Frontend'),
    TODO("NGONÉ (≈ 1,5 page) : structure de l'application, chargement à la demande, accessibilité, thème clair/sombre, tests de l'interface"),

    H2('4.2 Présentation de la solution'),
    H3("4.2.1 Espace citoyen"),
    TODO("NGONÉ : captures d'écran légendées des 6 écrans citoyens (accueil, carte, alertes et prévisions, signaler, profil, chat NDAM), chacune commentée en 2 à 3 lignes"),
    H3("4.2.2 Espace autorité"),
    TODO("NGONÉ : captures légendées des principaux écrans autorité (tableau de bord, carte, prédictions, signalements, gestion de crise, fiabilité du modèle) ; les autres vont en annexe"),
    H3('4.2.3 Scénario de démonstration'),
    TODO("MAÏMOUNA : déroulé d'un scénario de bout en bout (pluie → prédiction → alerte → SMS → signalement → itinéraire)"),

    H2('4.3 Tests et validation'),
    H3('4.3.1 Tests automatisés'),
    TODO("MAMA ADAM : tableau du nombre de tests et de la couverture par module (backend, IA, frontend), rôle de l'intégration continue"),
    H3("4.3.2 Évaluation du modèle d'intelligence artificielle"),
    TODO("MAÏMOUNA : tableau comparatif (toujours « vert », persistance, forêt aléatoire, forêt calibrée) avec le F1 par classe ; reconnaître honnêtement les limites : classes orange et rouge rares (10 et 3 cas dans le jeu de test), modèle calibré sans détection du niveau orange ; confronter aux hypothèses de l'introduction"),
    H3('4.3.3 Tests des parcours et audits'),
    TODO("NGONÉ et chacun : scénario manuel de bout en bout (inscription → code → signalement → alerte) et résultats ; synthèse des audits de fin de travail de chaque membre"),

    H2('4.4 Évaluation des coûts'),
    TODO("MAMA ADAM (≈ 1 page) : budget estimatif en FCFA. Lignes à chiffrer : hébergement (Render, Neon, Upstash, HiveMQ : offre gratuite utilisée / offre payante nécessaire en production), SMS (le lot de 100 SMS Orange coûte 2 000 FCFA selon la décision du projet), services d'IA, temps de travail des quatre membres, matériel. Distinguer coût du prototype et coût d'une exploitation réelle"),

    H2('4.5 Difficultés rencontrées et solutions apportées'),
    ...tableBlock('Tableau', 'Principales difficultés rencontrées',
      ['Difficulté', 'Solution apportée'],
      [
        ["Le compte d'essai Twilio refuse l'envoi de SMS vers le Sénégal", "Passage à l'API SMS d'Orange Sénégal ; envoi du code par e-mail en attendant l'activation"],
        ["Les alertes en temps réel (WebSocket) ne fonctionnaient pas dans un navigateur", "Transmission du jeton par sous-protocole WebSocket ; une seule connexion côté interface"],
        ["Des messages de test sont partis en production lors des tests", "Exécution des tâches en mode synchrone et isolement des tests de tout service externe"],
        ["Installation de GDAL/GEOS nécessaire à PostGIS sous Windows", "Installation via OSGeo4W, procédure notée dans les fichiers d'environnement"],
        ["Conflit de versions entre TensorFlow, protobuf et la version de Python", "Versions épinglées et version de Python fixée pour l'hébergement"],
        ["Fuite de données dans l'évaluation du modèle de prévision", "Séparation temporelle stricte : apprentissage 2010-2021, test 2022-2024"],
        ["Peu d'exemples de niveaux orange et rouge", "Calibration et validation temporelle ; limites présentées dans les résultats ; collecte de mesures réelles prévue"],
      ], [4300, 4770], "historique du dépôt de code. [[À valider par chaque auteur pour son domaine]]"),
  ];

  // ============================ CONCLUSION ============================
  const conclusion = [
    H1('CONCLUSION GÉNÉRALE ET PERSPECTIVES'),
    H2('Rappel de la problématique et des objectifs'),
    TODO("À RÉDIGER (≈ 0,3 page) : rappeler en quelques lignes la problématique et l'objectif général de l'introduction"),
    H2('Bilan'),
    TODO("À RÉDIGER (≈ 0,7 page) : tableau des objectifs spécifiques de l'introduction avec leur statut (atteint, partiellement atteint, non atteint) et une phrase de justification, en s'appuyant sur les résultats du chapitre 4"),
    H2('Apports du projet pour le groupe'),
    TODO("À RÉDIGER PAR CHAQUE MEMBRE (3 à 4 lignes chacun) : compétences techniques acquises et compétences transversales (travail en équipe, gestion du temps, communication)"),
    H2("Perspectives d'amélioration"),
    P("Plusieurs évolutions prolongeraient ce travail :"),
    B("installer de **vrais capteurs** de niveau d'eau et de pluie à Thiaroye-sur-Mer, et ré-entraîner les modèles sur des mesures réelles, notamment pour les niveaux orange et rouge, aujourd'hui peu représentés ;"),
    B("mettre en place un **traitement dédié des tâches planifiées** (processus séparé) et l'écoute permanente des capteurs sur l'hébergement ;"),
    B("renforcer la **sécurité** (politique de sécurité de contenu, stockage des jetons dans des cookies protégés, empreinte de vérification des modèles) ;"),
    B("ajouter des **tests de bout en bout** automatisés et augmenter la couverture de tests des modules météo, d'évaluation rétrospective et de l'interface ;"),
    B("activer l'**envoi de SMS** pour tous les citoyens et former des relais de quartier à la vérification des signalements."),
    TODO("À VALIDER PAR L'ÉQUIPE : cette liste reprend la dette technique relevée dans l'audit du 6 octobre 2026 ; ajouter ou retirer des perspectives"),
  ];

  return { corpsIntro, ch1, ch2, ch3, ch4, conclusion };
};
