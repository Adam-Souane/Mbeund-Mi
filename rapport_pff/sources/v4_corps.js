// Corps du rapport v4 : contenu de Rapport_PFF_MBEUND_MI.docx replacé dans le plan officiel ISEP-AT (modèle n° 2).
// Les paragraphes importés sont repris tels quels ; les corrections sont listées dans LOG et écrites dans
// docs/rapport/CORRECTIONS_RAPPORT.md. Tout ce qui est écrit à nouveau est signalé dans ce journal.
const fs = require('fs');
const path = require('path');
const { AlignmentType } = require('docx');
const R = require('./v4_rendu.js');
const { text, patch, splitLead, renderP, renderTable } = R;

const BLOCKS = JSON.parse(fs.readFileSync(path.join(__dirname, 'import', 'rapport.json'), 'utf8'));
const METRIQUES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'mbeund_mi_ia', 'data', 'metriques_rf.json'), 'utf8'));
const pct = (x, d = 1) => (x * 100).toFixed(d).replace('.', ',') + ' %';
const dec = (x, d = 2) => x.toFixed(d).replace('.', ',');
const LSTM = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'mbeund_mi_ia', 'data', 'metriques_lstm.json'), 'utf8'));
const SEUILS = JSON.parse(fs.readFileSync(path.join(__dirname, 'import', 'seuils.json'), 'utf8'));
const SCENARIOS = JSON.parse(fs.readFileSync(path.join(__dirname, 'import', 'scenarios.json'), 'utf8'));

module.exports = (h) => {
  const { H1, H2, H3, H4, P, B, caption, Unnumbered, tableBlock, table, Hc } = h;
  const { AlignmentType: AT } = require('docx');
  const LOG = [];
  const log = (ou, avant, apres, pourquoi) => LOG.push({ ou, avant, apres, pourquoi });
  const TODO = (t) => P('[[' + t + ']]');

  // ---------- accès aux blocs importés ----------
  const blk = (i) => BLOCKS[i];
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const expect = (i, debut) => { if (!norm(text(BLOCKS[i])).startsWith(debut)) throw new Error(`Bloc ${i} inattendu : ${text(BLOCKS[i]).slice(0, 60)} (attendu « ${debut} »)`); };
  let listInstance = 0, prevNum = false;
  function el(b) {
    if (b.t === 'tbl') { prevNum = false; return [renderTable(b), P('')]; }
    const t = norm(text(b));
    const hasImg = b.runs.some((r) => r.img);
    if (!t && !hasImg) return [];
    if (b.st === 'Lgende') {
      prevNum = false;
      const m = t.match(/^(Figure|Tableau)\s+(\d+)\s*:\s*(.*)$/s);
      if (!m) return [renderP(b, { align: AlignmentType.CENTER })];
      return caption(m[1], m[3], null, parseInt(m[2], 10));
    }
    if (b.st === 'Source') { prevNum = false; return [P(t.replace(/\*/g, ''), { style: 'Source' })]; }
    if (b.st === 'Titre4') { prevNum = false; return [H4(t)]; }
    if (/^Titre[123]$|^Titreliminaire$/.test(b.st)) throw new Error('Titre inattendu dans une plage : ' + t);
    if (b.num && b.num.fmt !== 'bullet') { if (!prevNum) listInstance += 1; prevNum = true; return [renderP(b, { list: listInstance })]; }
    prevNum = false;
    return [renderP(b)];
  }
  const PATCHES = {
    55: [['estimait à 360 000 le nombre de sinistrés directs dans la région de Dakar, pour des dommages et pertes évalués à 44,5 milliards de FCFA', "estimait à environ 360 000 le nombre de personnes directement touchées, pour un coût total d'environ 104 millions de dollars américains (56 millions de dommages et 48 millions de pertes), dont 82 millions pour les seules zones périurbaines de Dakar"]],
    57: [['supérieur à 118 % en 2024', 'supérieur à 127 % au premier trimestre 2024']],
    126: [['compte exactement 18 032 473 habitants selon les résultats définitifs du cinquième', 'compte 18 032 473 habitants selon les résultats du cinquième'], ['concentre 4 011 027 habitants (soit 22,2 % de la population nationale)', 'concentre 3 896 564 habitants (soit environ 21,6 % de la population nationale)']],
  };
  const range = (a, z) => { const out = []; for (let i = a; i <= z; i++) out.push(...el(PATCHES[i] ? patch(BLOCKS[i], PATCHES[i]) : BLOCKS[i])); return out; };
  const one = (b) => el(b);
  // « lead <br> corps » → paragraphe de titre en gras + paragraphes de corps
  const leadBody = (b, pairs) => {
    const bb = pairs ? patch(b, pairs) : b;
    const parts = splitLead(bb);
    const out = [];
    parts.forEach((p, k) => {
      if (k === 0) { p.runs = p.runs.map((r) => ({ ...r, b: 1 })); out.push(renderP(p, { align: AlignmentType.LEFT, keepNext: true })); }
      else out.push(renderP(p));
    });
    return out;
  };
  const clean = (b, pairs) => patch(b, pairs);

  // extrait de code réel, rendu dans une cellule (Consolas)
  const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle } = require('docx');
  const ROOT = path.join(__dirname, '..', '..');
  function codeExtrait(titre, fichier, plages) {
    const lignes = fs.readFileSync(path.join(ROOT, fichier), 'utf8').split('\n').map((l) => l.replace(/\r$/, ''));
    const paras = [];
    plages.forEach(([a, z], k) => {
      if (k > 0) paras.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: '    ...', font: 'Consolas', size: 17, color: '7F8C8D' })] }));
      for (let n = a; n <= z; n++) {
        paras.push(new Paragraph({ spacing: { before: 10, after: 10, line: 240 }, children: [new TextRun({ text: lignes[n - 1].split('\t').join('    ') || ' ', font: 'Consolas', size: 17, color: '212F3D' })] }));
      }
    });
    const bd = { style: BorderStyle.SINGLE, size: 4, color: 'D5DBDB' };
    const cell = new TableCell({
      width: { size: 9070, type: WidthType.DXA }, shading: { fill: 'F8F9FA', type: ShadingType.CLEAR, color: 'auto' },
      margins: { top: 100, bottom: 100, left: 180, right: 180 },
      borders: { left: { style: BorderStyle.SINGLE, size: 24, color: '4A2C1D' }, top: bd, right: bd, bottom: bd }, children: paras,
    });
    return [P('**' + titre + '**', { align: AlignmentType.LEFT, keepNext: true }), new Table({ width: { size: 9070, type: WidthType.DXA }, columnWidths: [9070], rows: [new TableRow({ cantSplit: false, children: [cell] })] }), P('')];
  }

  // ============================ INTRODUCTION GÉNÉRALE ============================
  expect(53, 'INTRODUCTION'); expect(55, 'Chaque hivernage'); expect(84, 'Le chapitre I');
  const intro = [
    H1('Introduction générale', false),
    Hc(2, 'Contexte général du projet', "Introduction resserrée à environ 3 pages (575 mots au lieu de 854) : paragraphes fusionnés, redites supprimées. Chiffres corrigés d'après les sources : le PDNA 2010 donne 360 000 personnes touchées et 104 millions de dollars (et non 44,5 milliards de FCFA) ; la pénétration mobile de l'ARTP est de 127 % au 1er trimestre 2024 (118 % date de 2021). Voir CORRECTIONS_RAPPORT.md."),
    P("Chaque hivernage, des pluies intenses submergent rues, habitations et commerces de la banlieue de Dakar, notamment à Pikine et à Guédiawaye, densément peuplées et bâties sur d'anciennes cuvettes et niayes. Après les inondations de 2009, l'évaluation des besoins post-catastrophe estimait à environ 360 000 le nombre de personnes touchées, pour un coût d'environ 104 millions de dollars américains (Gouvernement du Sénégal et al., PDNA 2010)."),
    P("La commune de **Thiaroye-sur-Mer**, sur le littoral sud de la presqu'île du Cap-Vert, illustre cette vulnérabilité : altitude très faible, nappe phréatique proche de la surface, évacuation des eaux longtemps insuffisante. Lors de notre enquête du 15 mai 2026, un commerçant nous a dit que l'eau lui arrivait « presque au-dessus des genoux » il y a environ deux ans, et des riverains évacuent eux-mêmes l'eau vers un terrain de football voisin."),
    P("Les dispositifs publics sont conçus à l'échelle nationale ou régionale et s'activent surtout une fois la crise déclarée. Or le téléphone mobile est un outil quotidien (taux de pénétration supérieur à 127 % au premier trimestre 2024, selon l'Autorité de Régulation des Télécommunications et des Postes, ARTP) et des données ouvertes (prévisions météorologiques, images satellitaires) sont gratuites : un outil numérique local, peu coûteux et participatif est possible. Le sujet est **social** (santé, biens et revenus des habitants), **opérationnel** (aide à la décision des autorités locales) et **académique** (il mobilise les compétences de la filière Analyse de Performance Digital)."),
    H2('Problématique'),
    P("Les inondations de Thiaroye-sur-Mer ne relèvent pas seulement d'un déficit d'infrastructures : elles révèlent aussi un **déficit d'information**. Les habitants ne reçoivent aucune alerte propre à leur quartier, leurs observations ne remontent pas vers les autorités, et celles-ci n'ont aucune vision consolidée pour prioriser leurs interventions. Comment, dès lors, exploiter les données disponibles, le numérique et la participation des habitants pour passer d'une gestion réactive à une gestion **anticipée et coordonnée** des inondations à l'échelle communale ?"),
    H3('Questions de recherche'),
    P("Comment une plateforme combinant données météorologiques, télédétection, intelligence artificielle et participation citoyenne peut-elle améliorer l'anticipation et la gestion des inondations à Thiaroye-sur-Mer ? Quatre questions spécifiques en découlent : (QS1) quelles données permettent de suivre le risque à l'échelle d'un quartier ; (QS2) un modèle d'apprentissage automatique peut-il l'estimer de manière fiable ; (QS3) comment informer rapidement tous les habitants, y compris sans smartphone ; (QS4) quel outil permet aux autorités de centraliser l'information et de coordonner leurs interventions ?"),
    H2('Objectif général et objectifs spécifiques'),
    P("L'objectif général est de concevoir, développer et évaluer une plateforme numérique de prévention et de gestion des inondations adaptée à Thiaroye-sur-Mer. Quatre objectifs spécifiques : **OS1**, collecter et géoréférencer dans une base spatiale les données météorologiques, satellitaires, de capteurs et de signalements ; **OS2**, entraîner et évaluer des modèles de classification du risque et de prédiction du niveau d'eau ; **OS3**, mettre en place une alerte multicanal et un signalement accessible sans smartphone ; **OS4**, offrir aux autorités un tableau de bord, des outils de gestion de crise et des itinéraires d'évacuation."),
    H3('Hypothèses de recherche'),
    P("À chaque question correspond une hypothèse, confrontée aux résultats au chapitre 4."),
    ...range(72, 74),
    H2('Méthodologie adoptée'),
    P("La démarche combine terrain et conception : une recherche documentaire ; une enquête exploratoire le 15 mai 2026 (observation directe et trois entretiens semi-directifs, qualitative et sans prétention de représentativité) ; l'analyse des besoins et la modélisation UML ; un développement itératif avec Git et des tests automatisés ; le traitement de 15 années de pluie journalière sur Dakar (2010-2024), d'images Sentinel-2, de capteurs simulés et de signalements. Limites : enquête restreinte à un secteur, capteurs simulés, niveaux d'eau reconstitués faute de mesures historiques (discutées au chapitre 4)."),
    Hc(2, 'Annonce du plan', "Réécrite pour le plan officiel de l'ISEP-AT (4 chapitres)."),
    P("Le **chapitre 1** présente le cadre du projet : l'établissement d'accueil, le projet MBEUND MI (origine, bénéficiaires, périmètre) et l'organisation du groupe. Le **chapitre 2** analyse l'existant, de la situation nationale aux solutions numériques disponibles, puis cadre le projet : critique de l'existant, besoins, solution retenue et planification. Le **chapitre 3** décrit la conception de la solution : démarche, architecture, modélisation et choix technologiques. Le **chapitre 4** présente la réalisation, les tests et les résultats, l'évaluation des coûts et les difficultés rencontrées."),
  ];
  log("Introduction, « Annonce du plan »", "Chapitre I cadre théorique, II contexte, III méthodologie, IV analytique", "Annonce du plan officiel de l'ISEP-AT en 4 chapitres", "Le plan du rapport suit désormais le modèle de l'ISEP-AT.");

  // ============================ CHAPITRE 1 ============================
  expect(29, 'Les Instituts'); expect(141, 'Thiaroye-sur-Mer est une commune'); expect(151, ''); expect(150, 'Sous-section 2');
  const ch1 = [
    H1('Chapitre 1 : Présentation du cadre du projet'),
    P("Ce chapitre présente le cadre dans lequel s'inscrit le projet : l'établissement qui l'accueille, le projet MBEUND MI lui-même (origine, bénéficiaires, périmètre) et l'organisation du groupe qui l'a réalisé."),
    H2("1.1  Présentation de la structure d'accueil ou du commanditaire"),
    ...range(29, 30),
    P("MBEUND MI est un projet interne à l'établissement : il n'a pas de commanditaire extérieur."),
    H2('1.2  Présentation du projet : origine, bénéficiaires, périmètre'),
    H3('1.2.1  Origine du projet'),
    P("L'idée du projet est née d'un constat vécu. À Dakar, et notamment à Grand Yoff, chaque série de pluies provoque de nombreuses inondations : des maisons sont abandonnées et des familles déménagent ailleurs. À Thiaroye-sur-Mer, le constat est tout aussi réel : en 2025, une série d'inondations a poussé des habitants à quitter leur maison."),
    P("Le Sénégal subit des inondations répétées depuis les années 1990 (voir 2.1.3). Ce problème, que nous observons autour de nous, nous a semblé un sujet utile pour notre projet de fin de formation : mettre les compétences acquises en Analyse de Performance Digital au service de sa résolution. Thiaroye-sur-Mer a été retenue comme cas d'étude, et l'enquête de terrain du 15 mai 2026 a confirmé le constat (voir 1.2.3)."),
    H3('1.2.2  La commune de Thiaroye-sur-Mer et ses quartiers à risque'), ...range(141, 149),
    H3('1.2.3  Causes et conséquences des inondations : les constats de terrain'), ...range(151, 161),
    H3('1.2.4  Bénéficiaires et périmètre'),
    P("Le projet s'adresse à trois catégories d'acteurs. Les **habitants** de Thiaroye-sur-Mer reçoivent des alertes par notification et par SMS, consultent la carte des risques et des points de refuge, signalent un problème par l'application ou par SMS et obtiennent un itinéraire d'évacuation. Les **autorités locales**, comptes habilités créés par un administrateur, disposent d'un tableau de bord, des prédictions, de la gestion de crise et des exports. Les **relais de quartier**, habitants volontaires, aident à vérifier les signalements de leur quartier."),
    P("Le **périmètre** est la commune de Thiaroye-sur-Mer : un signalement situé à plus de 4 km du centre de la commune est refusé (géorepérage). La plateforme est un outil d'aide à la décision et à l'information ; elle ne se substitue pas aux dispositifs officiels de protection civile. [[À valider par l'équipe]]"),
    H2('1.3  Organisation du groupe : rôles et outils de travail collaboratif'),
    P("Le projet a été conduit en équipe de quatre, avec la répartition suivante :"),
    ...range(32, 35),
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
  log("Avant-propos", "Section « Avant-propos » dans les pages liminaires", "Contenu réparti en 1.1 (ISEP-AT, PFF) et 1.3 (rôles)", "L'avant-propos n'existe pas dans le plan officiel. La phrase « Cette synergie concertée… parfaite complémentarité » n'a pas été reprise (formule non démontrable).");

  // ============================ CHAPITRE 2 ============================
  expect(88, 'Sous-section 1'); expect(96, 'Sous-section 2'); expect(125, 'Sous-section 1'); expect(132, 'Sous-section 2'); expect(108, 'Sous-section 1'); expect(113, 'Sous-section 2'); expect(167, 'Sous-section 1');
  const ch2 = [
    H1("Chapitre 2 : Analyse de l'existant et cadrage"),
    P("Ce chapitre décrit comment le besoin est traité aujourd'hui, en montre les limites, puis cadre la solution : besoins, solution retenue et planification du travail."),
    H2("2.1  Étude de l'existant"),
    P("Cette section rassemble les notions de base, la situation nationale, le cadre institutionnel et les outils numériques existants. [[À condenser par l'équipe : le plan officiel prévoit 6 à 8 pages pour tout le chapitre 2]]"),
    H3('2.1.1  Les inondations urbaines et côtières : définitions et typologie'), ...range(89, 95),
    H3("2.1.2  La gestion des risques de catastrophes et les systèmes d'alerte précoce"), ...range(97, 106),
    H3('2.1.3  Les inondations au Sénégal'), ...range(126, 131),
    H3('2.1.4  Le cadre institutionnel sénégalais'), ...range(133, 138),
    H3("2.1.5  Les systèmes d'information géographique appliqués aux inondations"), ...range(109, 112),
    H3('2.1.6  Les solutions numériques existantes en Afrique'), ...range(114, 119),
    H2("2.2  Critique de l'existant"),
    P("L'étude de l'existant fait apparaître quatre limites, qui fondent le besoin :"),
    B("**Des alertes trop larges.** Les alertes disponibles sont nationales ou régionales ; elles ne permettent pas d'anticiper la situation à l'échelle d'un quartier."),
    B("**Un maillon local faible.** Le cadre institutionnel est riche mais fragmenté ; son maillon le plus fragile est le niveau local."),
    B("**Des solutions numériques orientées vers d'autres problèmes.** Les outils existants en Afrique traitent surtout les crues fluviales à grande échelle, pas les inondations pluviales, phréatiques et côtières d'une commune littorale."),
    B("**Des habitants mobilisés mais peu outillés.** L'enquête de terrain montre des habitants qui trouvent eux-mêmes des solutions, sans outil de signalement ni d'information en temps réel."),
    TODO("À COMPLÉTER PAR L'ÉQUIPE : relier chaque limite à un passage de la section 2.1 (renvois)"),
    H2('2.3  Expression des besoins fonctionnels et non fonctionnels'), ...range(168, 178),
    H2('2.4  Solutions envisagées et choix retenu'),
    TODO("À RÉDIGER PAR L'ÉQUIPE (≈ 1 page) : comparer au moins trois solutions possibles (par exemple : alertes par SMS seules ; application mobile native ; plateforme web et mobile avec prévision par intelligence artificielle, qui est la solution retenue) dans un tableau de critères (couverture des besoins de la section 2.3, coût, maintenance, accessibilité) et justifier le choix"),
    H2('2.5  Planification du projet'),
    P("Le projet s'est déroulé de mai à octobre 2026. Le tableau suivant en retrace les jalons principaux, reconstitués à partir de l'historique du dépôt de code."),
    ...tableBlock('Tableau', 'Jalons du projet',
      ['Période', 'Jalon'],
      [
        ['15 mai 2026', 'Enquête de terrain à Thiaroye-sur-Mer'],
        ['Début juin 2026', "Création du dépôt ; premières briques d'intelligence artificielle et chatbot NDAM"],
        ['Août 2026', 'Backend : modèles, API, authentification, WebSocket, tâches planifiées, réception des capteurs'],
        ['Début septembre 2026', 'Base de données PostGIS, services météo et SMS'],
        ['Mi-septembre 2026', "Chaîne mesure, prédiction, alerte, SMS ; reconstruction du frontend ; itinéraire d'évacuation"],
        ['Fin septembre 2026', 'Comptes citoyens et autorités, authentification par code (OTP), notifications temps réel, déploiement'],
        ['Début octobre 2026', 'Audit de qualité et de sécurité, correction des anomalies, intégration continue, tests'],
        ['6 au 20 octobre 2026', 'Finalisation du code, audits par membre, rédaction du rapport, préparation de la soutenance'],
      ], [2600, 6470], "historique Git du dépôt. [[À valider par l'équipe]]"),
    TODO("À FAIRE PAR L'ÉQUIPE : diagramme de Gantt (figure) reprenant ces jalons avec la répartition des tâches par membre"),
  ];

  // ============================ CHAPITRE 3 ============================
  expect(179, 'Sous-section 2'); expect(186, 'Sous-section 3'); expect(207, 'Sous-section 1'); expect(217, 'Sous-section 2');
  const ch3 = [
    H1('Chapitre 3 : Conception de la solution'),
    P("Ce chapitre décrit le passage du besoin à la solution : la démarche de conception, l'architecture générale, la modélisation détaillée, puis les outils et technologies retenus. Les éléments présentés sont tirés du code source de la plateforme."),
    H2('3.1  Démarche et méthode de conception'), ...range(180, 185),
    H2('3.2  Architecture générale de la solution'), ...range(208, 211),
    H2('3.3  Modélisation détaillée'), ...range(187, 205),
    H2('3.4  Choix des outils, technologies et matériels'), ...range(212, 216),
  ];

  // ============================ CHAPITRE 4 ============================
  const RF = METRIQUES.random_forest, RFC = METRIQUES.random_forest_calibre, PER = METRIQUES.baseline_persistance, VERT = METRIQUES.baseline_toujours_vert;
  const f1 = (m, k) => dec(m.f1_par_classe[k]);
  const ligneModele = (nom, m) => [nom, pct(m.accuracy), dec(m.f1_macro), f1(m, 'vert'), f1(m, 'jaune'), f1(m, 'orange'), f1(m, 'rouge')];
  const eff = METRIQUES.protocole.effectifs_test;
  const nTest = eff.vert + eff.jaune + eff.orange + eff.rouge;

  expect(228, "L'efficacité"); expect(230, 'a) Données météo'); expect(231, 'b) Données topo'); expect(232, 'c) Télémétrie'); expect(233, 'd) Données partic');
  expect(235, 'a) Nettoyage'); expect(236, 'b) Détection'); expect(238, 'a) Modèle de classification'); expect(239, 'b) Modèle de prédiction'); expect(240, 'c) Télédétection');
  expect(244, 'a) Backend'); expect(245, 'b) Exécution'); expect(246, 'c) Moteur'); expect(247, "d) Assistant"); expect(249, 'a) Interface Citoyen'); expect(250, 'b) Console'); expect(259, 'b) Validation exp');
  const ch4 = [
    H1('Chapitre 4 : Réalisation, tests et résultats'),
    P("Ce chapitre présente la mise en œuvre de la plateforme (4.1), la solution réalisée (4.2), puis les tests et les résultats obtenus (4.3), l'évaluation des coûts (4.4) et les difficultés rencontrées (4.5). Les résultats sont présentés tels qu'ils ont été mesurés, y compris leurs limites."),

    H2('4.1  Mise en œuvre et environnement de travail'),
    H3('4.1.1  Environnement de travail'),
    P("Le backend est écrit en Python (Django 5.2, Django REST Framework 3.18) et le frontend en JavaScript (React 18, Vite, Tailwind CSS, Leaflet). Le code est hébergé sur GitHub, avec une branche par fonctionnalité. Une intégration continue (GitHub Actions) exécute à chaque modification le contrôle de style (ESLint, Ruff), les tests (pytest, Vitest) et la compilation du frontend. En production, le serveur tourne sur Render (serveur ASGI Daphne), la base PostgreSQL/PostGIS sur Neon, le cache et la file de tâches sur Upstash (Redis) et la messagerie des capteurs sur HiveMQ Cloud."),
    H3("4.1.2  Environnement d'expérimentation"),
    ...range(218, 220),
    ...one(clean(blk(221), [
      ["une forêt aléatoire de 50 arbres, calibrée par régression isotonique, entraînée sur 15 ans de pluie journalière (80 % des données pour l'apprentissage, 20 % pour le test). Faute de mesures historiques, le niveau d'eau est ", "une forêt aléatoire de 300 arbres, calibrée par une méthode sigmoïde avec validation croisée temporelle en 3 plis, entraînée sur la pluie journalière de 2010 à 2021 et testée sur 2022-2024. Elle prend en entrée la pluie du jour et les cumuls sur 24 h et 72 h, et prédit la classe de risque du lendemain, définie par des seuils sur le cumul de 72 h (20, 45 et 75 mm). Faute de mesures historiques de niveau d'eau, le niveau utilisé par le LSTM est "],
    ])),
    ...one(clean(blk(222), [
      ["Le logiciel est vérifié par 123 fonctions de test automatisées (112 pour le backend, 11 pour le module IA), exécutées en intégration continue sur GitHub Actions à chaque modification du backend,", "Le logiciel est vérifié par 308 tests automatisés (228 pour le backend, 41 pour le module IA et 39 pour l'interface), exécutés en intégration continue sur GitHub Actions à chaque modification,"],
    ])),
    Hc(3, '4.1.3  Données et prétraitement', "Corrigé d'après le code : sept zones du fichier topographie_thiaroye.csv (et non les quartiers cités avant), niveau d'eau du signalement estimé par la photo (et non choisi par l'utilisateur), nom du fichier du détecteur d'anomalies. Retiré : le temps de requête de 15 ms, non mesuré."),
    ...one(blk(228)),
    ...leadBody(clean(blk(230), [["l'API professionnelle Open-Meteo", "l'API ouverte Open-Meteo"]])),
    ...leadBody(blk(231).runs ? { ...blk(231), runs: [
      { ...blk(231).runs[0], x: 'b) Données topographiques et caractéristiques des sols de Thiaroye-sur-Mer :' }, { br: 'line' },
      { ...blk(231).runs[0], x: "Les données morphologiques et physiques proviennent du référentiel topographique du projet (fichier topographie_thiaroye.csv, [[À VÉRIFIER : source des données]]). Sept zones y sont caractérisées : Thiaroye Gare, Camp Militaire, Thiaroye sur Mer, CEM Thiaroye 44, Djida Thiaroye Kaw, Pikine Zone et Zone Côtière Yoff. Pour chacune, le fichier donne l'altitude (minimale, maximale et médiane, de 0,1 m à 9,4 m selon les zones), la pente moyenne (de 0,20 % à 1,49 %), la qualité du drainage (de « Bon » à « Très mauvais ») et la perméabilité du sol (de 10 % à 65 %). Ces variables alimentent le modèle en trois classes de la tâche planifiée." },
    ] } : null),
    ...leadBody(clean(blk(232), [
      [" assurant une alimentation continue du modèle de régression hydrologique.", " destinée à alimenter les modèles. [[À CONFIRMER : l'écoute des capteurs n'est pas encore démarrée sur l'hébergement de production ; en démonstration, les mesures proviennent du simulateur et de la commande seed_capteurs]]"],
    ])),
    ...leadBody({ ...blk(233), runs: [
      { ...blk(233).runs[0], x: 'd) Données participatives issues des signalements citoyens géolocalisés :' }, { br: 'line' },
      { ...blk(233).runs[0], x: "Le canal participatif constitue le quatrième pilier de l'observation. À travers l'interface de MBEUND MI, tout citoyen peut soumettre un signalement d'inondation : position GPS (WGS 84, limitée à 4 km du centre de la commune), description, photographie facultative et, le cas échéant, numéro de téléphone. Une analyse de la photographie estime un niveau d'eau visible (indéterminé, faible, modéré ou élevé) et calcule une empreinte pour repérer les doublons. Les signalements sont ensuite validés ou rejetés par les autorités avant de compter dans le référentiel des alertes." },
    ] }),
    ...leadBody(clean(blk(235), [['a) Nettoyage des données', 'e) Nettoyage des données'], [" Un index spatial GiST (Generalized Search Tree) est appliqué sur l'ensemble des colonnes géométriques, réduisant le temps d'exécution des requêtes d'intersection spatiale (ST_Intersects, ST_DWithin) sous la barre des 15 millisecondes, même en charge concurrente.", " Les colonnes géométriques sont indexées par des index spatiaux (GiST) créés par les migrations Django, ce qui accélère les requêtes d'intersection spatiale (ST_Intersects, ST_DWithin). [[Temps de réponse non mesuré : à mesurer avant de l'écrire]]"]])),
    ...leadBody(clean(blk(236), [
      ['b) Détection des anomalies', 'f) Détection des anomalies'],
      ["'mbeund_mi_ia/ia/detection_anomalies.py'", "'mbeund_mi_ia/ia/detecteur_anomalies.py'"],
      [" et les marque d'un drapeau d'invalidation 'is_anomaly=True', empêchant ainsi", " et les marque comme anomalies à exclure du calcul (action « EXCLURE_DU_CALCUL »), empêchant ainsi"],
      ["Entraîné sur des distributions plausibles de montée d'eau et de pluviométrie sahélienne, l'algorithme", "Des règles simples (valeur négative, niveau supérieur à 500 cm) complètent l'algorithme, qui"],
    ])),

    Hc(3, "4.1.4  Modèles d'intelligence artificielle", "Random Forest : 300 arbres, calibration sigmoïde, 3 variables de pluie, test 2022-2024 (metriques_rf.json). Seuil d'activation : 15 mm (tasks.py), pas 30. NDWI : seuil 0,3 (config_gee.py), pas 0,1. LSTM : pas d'activation ReLU sur la couche LSTM ; entraînement sur 15 ans de pluie avec 5 variables dont la pluie prévue."),
    ...leadBody({ ...blk(238), runs: [
      { ...blk(238).runs[0], x: 'a) Classification du risque par forêt aléatoire (Random Forest) :' }, { br: 'line' },
      { ...blk(238).runs[0], x: `Le cœur prédictif repose sur un classifieur Random Forest (scikit-learn) de 300 arbres, entraîné sur la pluie journalière de Dakar de 2010 à 2021 et testé sur 2022-2024 (${nTest.toLocaleString('fr-FR')} jours). Il prend en entrée trois variables : la pluie du jour et les cumuls sur 24 h et 72 h. La classe à prédire est le niveau de risque du lendemain (vert, jaune, orange, rouge), défini par des seuils sur le cumul de 72 h (20, 45 et 75 mm). Pour fournir des probabilités exploitables, le classifieur est calibré par une méthode sigmoïde avec validation croisée temporelle en 3 plis. Un seuil d'activation de 15 mm de pluie sur 24 heures (PLUIE_MIN_MODELE_MM) est appliqué dans la tâche planifiée : en dessous, le modèle n'est pas invoqué et la zone reste au vert, car ces faibles pluies sont hors du domaine d'entraînement.` },
    ] }),
    ...leadBody(clean(blk(239), [
      [" de 64 unités avec fonction d'activation ReLU et retour des séquences", " de 64 unités avec retour des séquences"],
      [" Le modèle s'alimente d'une fenêtre temporelle glissante de 24 jours consécutifs combinant le cumul de pluie journalier et le niveau d'eau maximal relevé.", " Le modèle s'alimente d'une fenêtre glissante de 24 jours consécutifs de cinq variables : pluie du jour, cumuls sur 24 h et 72 h, niveau d'eau et pluie prévue pour le jour à prédire. Il est entraîné sur 15 ans de pluie journalière de Dakar (5 454 séquences, découpage chronologique 70 %, 15 % et 15 %, arrêt précoce sur la validation). Faute de mesures, le niveau d'eau est reconstitué à partir de la pluie ; à l'entraînement, la pluie prévue est la pluie réellement tombée, alors qu'en production elle provient d'une prévision Open-Meteo."],
    ])),
    ...leadBody(clean(blk(240), [
      ["un masque binaire d'eau libre (NDWI > 0,1) est généré", "un masque binaire d'eau libre (NDWI > 0,3) est généré, puis les pixels d'eau absents de l'image de référence sont retenus comme nouvellement inondés"],
    ])),

    Hc(3, '4.1.5  Backend, temps réel et services', "Retirés : latence de 120 ms et temps de réponse de 0,4 s (non mesurés). Corrigés : coût du tronçon = longueur × (1 + 5 × risque), sans coût infini ; chatbot gpt-oss-120b via Groq (pas Llama 3.3). Ajouté : la planification des tâches et l'envoi réel de SMS ne sont pas encore validés en production."),
    ...leadBody(clean(blk(244), [
      [" avec une latence réseau inférieure à 120 ms.", "."],
      ["Daphne 4.2", "Daphne 4.2"],
    ])),
    ...leadBody(clean(blk(245), [
      [" éliminant le coût d'hébergement d'un Background Worker dédié tout en assurant un départ d'alerte sans aucune file d'attente.", " éliminant le coût d'hébergement d'un processus de travail dédié. Les tâches périodiques (météo toutes les 3 h, prédictions toutes les 6 h, analyse satellite toutes les 12 h) doivent alors être déclenchées par une commande planifiée. [[À CONFIRMER : planification en production en cours (tâche R02 du plan de travail)]] L'envoi réel de SMS au Sénégal par la passerelle Orange dépend de l'approbation des identifiants, qui n'est pas encore obtenue : il est vérifié par des tests automatisés avec un fournisseur simulé."],
    ])),
    ...leadBody(clean(blk(246), [
      ["un segment inondé reçoit une pénalité de coût proportionnelle à la hauteur d'eau, voire un coût infini en cas de danger mortel.", "le coût de franchissement d'un tronçon est égal à sa longueur multipliée par (1 + 5 × son score de risque) : un tronçon au risque maximal coûte six fois sa longueur réelle, ce qui favorise un détour plus long mais plus sûr."],
      ["Chaque arête représente un segment de rue ('SegmentRue') caractérisé par sa longueur géométrique et son niveau de submersion mesuré ou prédit.", "Chaque arête représente un segment de rue ('SegmentRue') caractérisé par sa longueur géométrique et son score de risque actuel."],
    ])),
    ...leadBody(clean(blk(247), [
      ["(Groq Llama 3)", "(Groq)"],
      ["Propulsé par le modèle de langage avancé Llama 3 (version llama-3.3-70b-versatile) hébergé sur l'infrastructure d'inférence ultra-rapide Groq (temps de réponse moyen de 0,4 seconde), NDAM est spécialisé", "Propulsé par le modèle de langage gpt-oss-120b hébergé sur l'infrastructure d'inférence Groq, NDAM est spécialisé"],
      ["en français et en wolof phonétique", "en français (le module de recommandations produit aussi des messages en wolof)"],
      ["arborant le logo officiel de la commune", "arborant le logo et la charte graphique de MBEUND MI"],
    ])),

    H2('4.2  Présentation de la solution'),
    P("La solution comprend deux espaces, l'un pour les citoyens, l'autre pour les autorités, accessibles depuis un navigateur sur ordinateur ou sur téléphone."),
    Hc(3, '4.2.1  Espace citoyen', "Description alignée sur les écrans réels (Signaler, Carte). Retiré : « plus de 90 % de smartphones », chiffre sans source."),
    ...leadBody(clean(blk(249), [
      ['a) Interface Citoyen', 'Interface citoyen'],
      ["qui représente plus de 90 % des terminaux d'accès à Thiaroye. ", ". "],
      ["Un bouton d'action flottant permet de déclencher la procédure de signalement en trois étapes simples : géolocalisation automatique par GPS, sélection de la hauteur d'eau avec repères anatomiques illustrés, et prise de photo. En cas d'alerte rouge, un bandeau d'urgence propose en un clic de calculer l'itinéraire de fuite piéton le plus sûr vers le refuge désigné.", "L'écran « Signaler » permet d'envoyer un signalement géolocalisé avec une description et une photographie. L'écran « Carte » affiche les refuges et propose, à partir de la position de l'utilisateur, l'itinéraire d'évacuation le plus sûr vers un refuge."],
      ["Mobile-First' pour garantir une ergonomie sans faille sur smartphone", "Mobile-First' pour une utilisation confortable sur smartphone"],
    ])),
    TODO("NGONÉ : captures d'écran légendées des 6 écrans citoyens (accueil, carte, alertes et prévisions, signaler, profil, chat NDAM), chacune commentée en 2 à 3 lignes"),
    Hc(3, '4.2.2  Espace autorité', "Le tableau de bord a 4 indicateurs (zones à risque élevé, prédiction à 24 h, score moyen, alertes émises), et non 6 : il n'y a pas de données sur les motopompes ni les bassins."),
    ...leadBody({ ...blk(250), runs: [
      { ...blk(250).runs[0], x: "Console des autorités : supervision, modération et gestion de crise :" }, { br: 'line' },
      { ...blk(250).runs[0], x: "L'espace réservé aux autorités habilitées offre une vue d'ensemble d'aide à la décision. Le tableau de bord affiche quatre indicateurs : le nombre de zones à risque élevé, la prédiction du niveau d'eau à 24 h, le score de risque moyen et le nombre d'alertes émises. La carte interactive permet de visualiser les zones, les capteurs et les refuges ; les signalements citoyens peuvent être validés ou rejetés ; l'écran de gestion de crise permet d'émettre manuellement une alerte vers une zone par SMS et par notification ; des pages complémentaires donnent accès aux prédictions, à la fiabilité du modèle, au rejeu historique, aux exports CSV et PDF et à la gestion des comptes des autorités." },
    ] }),
    TODO("NGONÉ : captures légendées des principaux écrans autorité (tableau de bord, carte, prédictions, signalements, gestion de crise, fiabilité du modèle) ; les autres vont en annexe"),
    Hc(3, '4.2.3  Scénario de démonstration', "Rédigé à partir du script demo/demo_scenarii.py et d'un rejeu réel des trois scénarios le 6 octobre 2026 (rapport_pff/sources/mesures/rejeu_scenarios.py)."),
    P("Un script de démonstration (mbeund_mi_ia/demo/demo_scenarii.py) rejoue des relevés simulés selon trois scénarios. À chaque relevé, le service de prédiction calcule le niveau de risque ; pour les niveaux orange et rouge, le déclencheur d'alertes transmet l'alerte à la plateforme, aux notifications push et aux SMS. Le tableau suivant donne les résultats obtenus le 6 octobre 2026 avec les modèles du dépôt, sans historique de 24 jours ni prévisions externes (qualité des données « dégradée »)."),
    ...tableBlock('Tableau', 'Résultats du rejeu des trois scénarios de démonstration (5 relevés chacun)',
      ['Scénario', 'Relevés simulés', 'Risque obtenu', 'Confiance', 'Niveau d\'eau prévu à 24 h (dernier relevé)'],
      SCENARIOS.map((s) => {
        const r = s.releves, d = r[0], f = r[r.length - 1];
        const eau = d.eau_cm === f.eau_cm ? `eau ${d.eau_cm} cm` : `eau de ${d.eau_cm} à ${f.eau_cm} cm`;
        return [s.scenario, `${eau} ; pluie ${d.pluie_mm} mm/h`, [...new Set(r.map((x) => x.risque))].join(', '), pct(f.confiance / 100), `${dec(f.niveau_24h_cm, 1)} cm`];
      }), [2000, 2900, 1200, 1100, 1870], 'rejeu des auteures (rapport_pff/sources/mesures/rejeu_scenarios.py), 6 octobre 2026'),
    P("Le niveau de risque suit la gravité du scénario : vert, orange puis rouge. La confiance du modèle reste faible (environ 42 % pour les scénarios orange et rouge), ce qui confirme la difficulté du modèle sur les classes rares (section 4.3.2). La prévision du niveau d'eau à 24 h est ici empirique : sans historique, le LSTM n'est pas utilisé. Ce script est une démonstration à données simulées ; il ne remplace pas un essai de terrain."),

    H2('4.3  Tests et validation'),
    Hc(3, '4.3.1  Tests automatisés et contrôles de qualité', "Remplace « 153 tests Pytest et 31 tests Vitest, couverture 82,1 % » par les exécutions du 6 octobre 2026 (backend 228, IA 37, interface 39 ; couverture backend 78 %)."),
    P("Les contrôles ci-dessous ont été exécutés le 6 octobre 2026 sur la dernière version du code, sans aucun service externe (base SQLite locale, fournisseurs simulés)."),
    ...tableBlock('Tableau', 'Tests automatisés et contrôles de qualité (6 octobre 2026)',
      ['Contrôle', 'Résultat'],
      [
        ['Tests du backend (pytest)', '228 tests réussis, 0 échec ; couverture des lignes de code : 78 % (3 556 instructions)'],
        ["Tests du module d'intelligence artificielle", '41 tests réussis (dont 30 sur le service de prédiction)'],
        ["Tests de l'interface (Vitest)", '39 tests réussis dans 7 fichiers ; couverture non mesurée'],
        ['Contrôle du style et des défauts', 'ESLint : 0 erreur, 0 avertissement ; Ruff : 0 erreur'],
        ["Compilation de l'interface", 'Réussie'],
        ['Vulnérabilités des dépendances du frontend', '0 (npm audit, dépendances de production)'],
      ], [3500, 5570], 'exécution locale des auteures, 6 octobre 2026'),
    P("Les modules les moins couverts par les tests du backend sont le service météo (26 %), le rejeu historique (39 %), le prédicteur en trois classes (58 %) et le service SMS (62 %)."),
    Hc(3, '4.3.2  Évaluation du modèle de classification du risque', "Remplace l'exactitude de 87,4 % (non reproductible) par les mesures de metriques_rf.json, avec les deux références simples. Conclusion honnête : pas de gain démontré sur la persistance, niveaux rares mal détectés."),
    P(`Le classifieur est évalué sur ${nTest.toLocaleString('fr-FR')} jours (2022-2024) : ${eff.vert.toLocaleString('fr-FR')} jours verts, ${eff.jaune} jaunes, ${eff.orange} oranges et ${eff.rouge} rouges. Deux références simples servent de comparaison : prédire toujours « vert », et prédire la classe de la veille (persistance).`),
    ...tableBlock('Tableau', 'Performances des modèles de classification du risque sur le jeu de test (2022-2024)',
      ['Modèle', 'Exactitude', 'F1 macro', 'F1 vert', 'F1 jaune', 'F1 orange', 'F1 rouge'],
      [ligneModele('Toujours « vert »', VERT), ligneModele('Persistance (classe de la veille)', PER), ligneModele('Random Forest', RF), ligneModele('Random Forest calibré', RFC)],
      [2470, 1100, 1000, 1000, 1000, 1250, 1250], 'mbeund_mi_ia/data/metriques_rf.json ; calculs des auteures'),
    P(`Le Random Forest classe correctement ${pct(RF.accuracy)} des jours, et ${pct(RFC.accuracy)} après calibration. Ces valeurs sont toutefois dominées par la classe « vert », très majoritaire : le F1 macro, qui pèse chaque classe de la même façon, est de ${dec(RF.f1_macro)} (${dec(RFC.f1_macro)} après calibration), inférieur à celui de la simple persistance (${dec(PER.f1_macro)}). Les niveaux orange et rouge, les plus importants pour la sécurité, sont mal détectés : le modèle calibré ne reconnaît aucun des ${eff.orange} jours orange du jeu de test. Les effectifs de ces classes sont très faibles (${eff.orange} et ${eff.rouge} jours) : toute conclusion statistique y est fragile.`),
    P("Ces résultats montrent que le modèle, entraîné sur la seule pluie, n'apporte pas de gain démontré par rapport à une règle simple. Ils s'expliquent par le manque d'exemples de crues et par l'absence de mesures réelles de niveau d'eau. Ils justifient la collecte de mesures de terrain, présentée dans les perspectives."),
    Hc(3, '4.3.3  Évaluation du réseau LSTM et de la détection satellite', "Le MAE de 4,2 cm et le R² de 0,891 d'origine n'étaient pas reproductibles. Le LSTM a été réentraîné le 6 octobre 2026 (15 ans de pluie, pluie prévue en entrée) et évalué sur un jeu de test chronologique : 2,8 cm contre 5,0 cm pour la persistance. Retiré : le Kappa de 0,81 sur le satellite, sans validation dans le dépôt."),
    P(`**Réseau LSTM.** Le LSTM est évalué sur ${LSTM.sequences.test} séquences de test (les 15 % de jours les plus récents, jamais vus à l'entraînement), contre deux références : la persistance (le niveau de demain égale celui d'aujourd'hui) et la règle empirique de repli du service (niveau actuel plus la moitié de la pluie prévue).`),
    ...tableBlock('Tableau', 'Erreur de prévision du niveau d\'eau à 24 h sur le jeu de test (en cm)',
      ['Modèle', 'Erreur absolue moyenne', 'Erreur quadratique moyenne', `Erreur absolue moyenne, ${LSTM.jours_test_niveau_ge_30cm} jours à 30 cm ou plus`],
      [['LSTM', 'lstm'], ['Persistance', 'persistance'], ['Règle empirique', 'regle_empirique']].map(([n, k]) => [n, dec(LSTM[k].mae, 1), dec(LSTM[k].rmse, 1), dec(LSTM.sur_les_jours_ge_30cm[k].mae, 1)]),
      [2400, 2000, 2200, 2470], "mbeund_mi_ia/data/metriques_lstm.json ; calculs des auteures, 6 octobre 2026"),
    P(`Le LSTM réduit l'erreur moyenne à ${dec(LSTM.lstm.mae, 1)} cm, contre ${dec(LSTM.persistance.mae, 1)} cm pour la persistance et ${dec(LSTM.regle_empirique.mae, 1)} cm pour la règle empirique. L'écart est surtout net sur les jours de hauts niveaux, où l'erreur tombe à ${dec(LSTM.sur_les_jours_ge_30cm.lstm.mae, 1)} cm contre ${dec(LSTM.sur_les_jours_ge_30cm.persistance.mae, 1)} et ${dec(LSTM.sur_les_jours_ge_30cm.regle_empirique.mae, 1)} cm.`),
    P("**Réserves.** Ces résultats portent sur un niveau d'eau *reconstitué* à partir de la pluie, faute de capteurs : ils montrent que le modèle sait prévoir ce niveau, pas un niveau mesuré à Thiaroye-sur-Mer. De plus, à l'évaluation, la pluie prévue pour le lendemain est la pluie réellement tombée ; en production elle provient d'une prévision, moins précise. Une validation sur des mesures de capteurs réels reste nécessaire."),
    P("**Historique.** Une première version, entraînée sur 190 séquences seulement et sans pluie prévue, ne dépassait pas la persistance (erreur de 8,0 cm contre 6,0 cm, mesure du 3 octobre 2026). Ce constat a conduit au réentraînement du 6 octobre, qui utilise les 15 ans de pluie disponibles et la pluie prévue comme variable d'entrée."),
    P("**Détection satellite.** La détection des zones nouvellement inondées par l'indice NDWI (seuil 0,3) est intégrée à la chaîne d'alerte et exécutée toutes les 12 heures. Elle n'a pas fait l'objet d'une validation quantitative contre des polygones d'inondation observés : aucune valeur de précision n'est donc annoncée."),
    H3("4.3.4  Essai de la chaîne complète avec les prévisions du 4 octobre 2026"),
    ...leadBody(clean(blk(259), [
      ["b) Validation expérimentale lors des précipitations réelles du 4 octobre 2026 à Thiaroye-sur-Mer :", "Essai"],
      ["Une opportunité expérimentale exceptionnelle s'est présentée le 4 octobre 2026, date à laquelle un épisode pluvieux réel a touché la presqu'île de Dakar. L'interrogation en direct", "Le 4 octobre 2026, la chaîne a été exécutée sur des données réelles. L'interrogation en direct"],
      ["(PLUIE_MIN_MODELE_MM = 30,0 mm)", "(PLUIE_MIN_MODELE_MM, aujourd'hui fixé à 15 mm)"],
      [", démontrant la robustesse du système face au risque de sur-alerte pour des pluies sans danger.", ", ce qui évite une sur-alerte pour une pluie sans danger. [[À VÉRIFIER : valeurs relevées le 4 octobre, à confirmer par le journal d'exécution]]"],
      ["Des simulations d'intensification artificielle ont simultanément confirmé le basculement automatique en JAUNE dès 45 mm (score 0,40) et en ORANGE dès 65 mm (score 0,50, probabilité 99 %).", "Le rejeu de la même chaîne pour plusieurs cumuls de pluie, mesuré le 6 octobre 2026, est donné ci-dessous."],
    ])).slice(1),
    P("Cet essai porte sur la chaîne logicielle, depuis la météo jusqu'à la décision : il ne constitue pas une validation sur le terrain, aucune inondation n'ayant eu lieu ce jour-là et aucun capteur n'étant installé."),
    ...tableBlock('Tableau', 'Niveau de risque par zone selon le cumul de pluie sur 24 h (rejeu de la tâche planifiée, 6 octobre 2026)',
      ['Pluie sur 24 h', ...Object.keys(SEUILS.resultats[0].zones)],
      SEUILS.resultats.map((l) => [`${l.pluie_24h_mm} mm`, ...Object.values(l.zones).map((v) => (v.modele_appele ? `${v.niveau} (${dec(v.score, 2)})` : 'vert (0)'))]),
      [1000, ...Object.keys(SEUILS.resultats[0].zones).map(() => 1153)], "rejeu des auteures (rapport_pff/sources/mesures/rejeu_seuils.py) : seuil d'activation 15 mm, seuils des zones 0,40 (jaune), 0,65 (orange) et 0,85 (rouge)"),
    P("Sous 15 mm, le modèle n'est pas appelé et toutes les zones restent vertes. Entre 15 et 30 mm, les scores ne varient pas : le modèle, entraîné sur 25 épisodes construits, n'a pas d'exemples plus faibles. Les zones les plus basses réagissent en premier : Thiaroye sur Mer (altitude médiane de 1,4 m) passe au jaune dès 15 mm, à l'orange à 65 mm et au rouge à 80 mm ; la Zone Côtière Yoff (0,8 m) passe à l'orange dès 45 mm et au rouge à 80 mm. Thiaroye Gare passe au jaune à 45 mm (score de 0,40) et reste jaune à 65 mm (score de 0,50, inférieur au seuil orange de 0,65). Les zones les plus hautes (Camp Militaire, CEM Thiaroye 44, Djida Thiaroye Kaw) restent vertes jusqu'à 65 mm."),
    Hc(3, '4.3.5  Confrontation avec les hypothèses de recherche', "Le chapitre IV d'origine vérifiait trois hypothèses différentes de celles de l'introduction, toutes « CONFIRMÉE ». Reprise avec H1 à H4 de l'introduction et une conclusion honnête pour chacune."),
    P("Les quatre hypothèses posées en introduction sont confrontées aux résultats. Le prototype démontre la faisabilité technique ; il n'a pas encore été évalué auprès des habitants et des autorités."),
    ...tableBlock('Tableau', 'Confrontation des hypothèses aux résultats',
      ['Hypothèse', 'Éléments observés', 'Conclusion'],
      [
        ['H1 : les sources ouvertes et les signalements géolocalisés suffisent à produire une carte de risque exploitable par zone', "La carte par zone est produite à partir des prévisions Open-Meteo, du modèle de risque, de l'analyse satellite et des signalements validés. Son utilité n'a pas été éprouvée par les autorités.", 'Partiellement vérifiée : faisabilité démontrée, exploitabilité non évaluée'],
        ["H2 : un classifieur calibré fournit des probabilités de risque fiables, la calibration améliorant le score de Brier", `La calibration améliore l'exactitude (${pct(RF.accuracy)} à ${pct(RFC.accuracy)}) mais dégrade le F1 macro (${dec(RF.f1_macro)} à ${dec(RFC.f1_macro)}) et la détection du niveau orange. Le score de Brier n'a pas été recalculé avec le protocole actuel.`, 'Non confirmée en l\'état ; Brier à mesurer'],
        ["H3 : un dispositif multicanal incluant le SMS réduit le délai entre la détection et l'information des habitants", "WebSocket, notifications push et SMS sont réalisés et testés avec des fournisseurs simulés. Aucun délai réel n'a été mesuré et l'envoi de SMS au Sénégal n'est pas encore validé.", 'Non vérifiée empiriquement'],
        ["H4 : un tableau de bord et des itinéraires d'évacuation améliorent la coordination des interventions", "Le tableau de bord, la gestion de crise et l'itinéraire pondéré par le risque sont réalisés et testés. Aucun essai avec des autorités n'a eu lieu.", 'Non vérifiée : fonctions réalisées, effet non mesuré'],
      ], [2900, 3900, 2270], 'analyse des auteures'),
    P("Pour confirmer ou infirmer ces hypothèses, il faudrait une expérimentation de terrain pendant un hivernage, avec des capteurs réels, un envoi de SMS réel et des autorités locales utilisatrices."),

    H2('4.4  Évaluation des coûts'),
    P("Le prototype a été réalisé avec des offres gratuites des fournisseurs. Le tableau suivant distingue ce qui a été utilisé de ce qu'il faudrait payer pour une exploitation réelle."),
    ...tableBlock('Tableau', 'Budget estimatif',
      ['Poste', 'Prototype', 'Exploitation réelle'],
      [
        ['Hébergement du serveur (Render)', 'Offre gratuite', '[[À chiffrer : offre payante, nécessaire pour un processus de tâches dédié]]'],
        ['Base de données (Neon), Redis (Upstash), MQTT (HiveMQ)', 'Offres gratuites', '[[À chiffrer]]'],
        ['SMS (Orange SMS Sénégal)', '25 FCFA pour un lot de test de 25 SMS', "2 000 FCFA pour un lot de 100 SMS ; [[à confirmer et à ramener au coût par alerte]]"],
        ['Services d\'intelligence artificielle (Groq), imagerie (Google Earth Engine), météo (Open-Meteo)', 'Usage gratuit', '[[À vérifier : conditions d\'usage et tarifs en exploitation]]'],
        ['Capteurs de niveau d\'eau et de pluie', 'Simulés (0 FCFA)', '[[À chiffrer : achat, installation et maintenance de 8 capteurs]]'],
        ['Temps de travail', '4 étudiants × [[nombre de jours]]', '[[À chiffrer]]'],
      ], [3200, 2400, 3470], "offres des fournisseurs consultées par les auteures. [[À valider par l'équipe]]"),

    H2('4.5  Difficultés rencontrées et solutions apportées'),
    ...tableBlock('Tableau', 'Principales difficultés rencontrées',
      ['Difficulté', 'Solution apportée'],
      [
        ["Le compte d'essai Twilio refuse l'envoi de SMS vers le Sénégal", "Passage à l'API SMS d'Orange Sénégal ; envoi du code par e-mail en attendant l'approbation des identifiants"],
        ["Les alertes en temps réel (WebSocket) ne fonctionnaient pas dans un navigateur", "Transmission du jeton par sous-protocole WebSocket ; une seule connexion côté interface"],
        ["Des messages de test sont partis en production lors des tests", "Exécution des tâches en mode synchrone et isolement des tests de tout service externe"],
        ["Installation de GDAL/GEOS nécessaire à PostGIS sous Windows", "Installation via OSGeo4W, procédure notée dans les fichiers d'environnement"],
        ["Conflit de versions entre TensorFlow, protobuf et la version de Python", "Versions épinglées et version de Python fixée pour l'hébergement"],
        ["Fuite de données dans l'évaluation du modèle de prévision", "Séparation temporelle stricte : apprentissage 2010-2021, test 2022-2024"],
        ["Peu d'exemples de niveaux orange et rouge", "Calibration et validation temporelle ; limites présentées dans les résultats ; collecte de mesures réelles prévue"],
      ], [4300, 4770], "historique du dépôt de code. [[À valider par chaque auteur pour son domaine]]"),
  ];

  // ============================ CONCLUSION ============================
  expect(270, 'Le présent Projet'); expect(272, 'Au plan scientifique'); expect(273, 'Au plan social'); expect(274, 'Au plan personnel'); expect(275, 'Certes'); expect(266, 'Sous-section 1'); expect(267, 'Sous-section 2');
  const conclusion = [
    H1('Conclusion générale et perspectives'),
    H2('Rappel de la problématique et des objectifs'),
    ...one(blk(270)),
    ...one(clean(blk(271), [[", nous avons conçu, développé et validé MBEUND MI, une plateforme numérique intelligente, modulaire et inclusive d'alerte précoce.", ", nous avons conçu et développé MBEUND MI, un prototype fonctionnel de plateforme numérique d'alerte précoce, modulaire et ouverte à tous les habitants."]])),
    Hc(2, 'Bilan des résultats', "Chiffres 87,4 % et 4,2 cm remplacés ; « système autonome », « capacité inédite » et « chaque chef de famille » ramenés à ce qui est démontré. Tableau de bilan des objectifs ajouté."),
    ...one(clean(blk(272), [
      ["MBEUND MI dépasse le simple cadre d'un tableau de bord pour devenir un système décisionnel autonome. L'implémentation conjointe d'un classifieur Random Forest calibré par régression isotonique (exactitude de 87,4 %) et d'un réseau récurrent LSTM (erreur absolue de 4,2 cm) confère à la commune une capacité d'anticipation locale inédite, réduisant l'incertitude opérationnelle.", "MBEUND MI dépasse le simple cadre d'un tableau de bord pour constituer un système d'aide à la décision. L'association d'un classifieur Random Forest calibré et d'un réseau récurrent LSTM pose les bases d'une anticipation locale ; leurs performances mesurées au chapitre 4 montrent toutefois qu'elles restent à consolider avec des données réelles."],
    ])),
    ...one(clean(blk(273), [
      ["accessible en français et en wolof", "accessible en français"],
      ["un canal de diffusion par SMS garantissant que l'alerte parvienne à chaque chef de famille, indépendamment de son équipement téléphonique ou de son niveau d'alphabétisation.", "un canal de diffusion par SMS destiné à atteindre les habitants sans smartphone, dont l'activation en production reste à finaliser."],
    ])),
    P("Le tableau suivant fait le bilan des objectifs spécifiques fixés en introduction."),
    ...tableBlock('Tableau', 'Bilan des objectifs spécifiques',
      ['Objectif', 'Statut', 'Justification'],
      [
        ["OS1 : collecter et géoréférencer les données météorologiques, satellitaires, de capteurs et de signalements", 'Atteint en grande partie', 'Les quatre sources sont intégrées dans la base spatiale ; les capteurs sont simulés'],
        ["OS2 : entraîner et évaluer des modèles de classification du risque et de prédiction du niveau d'eau", 'Partiellement atteint', "Modèles entraînés et évalués ; classifieur limité sur les niveaux rares ; LSTM meilleur que les références sur un niveau d'eau reconstitué"],
        ['OS3 : mettre en place une alerte multicanal et un canal de signalement accessible sans smartphone', 'Partiellement atteint', "Canaux réalisés et testés ; envoi réel de SMS au Sénégal non validé"],
        ["OS4 : offrir aux autorités un tableau de bord, des outils de gestion de crise et des itinéraires d'évacuation", 'Atteint', "Fonctions réalisées et testées ; évaluation auprès des autorités à faire"],
      ], [3700, 1700, 3670], 'analyse des auteures. [[À valider par l\'équipe]]'),
    H2('Apports du projet pour le groupe'),
    ...one(blk(274)),
    Hc(2, "Perspectives d'amélioration", "« MBEUND BI » renommé (le projet s'appelle MBEUND MI). Recommandations d'origine conservées ; perspectives techniques de l'audit du 6 octobre ajoutées."),
    ...one(clean(blk(275), [["Néanmoins, MBEUND MI pose les fondations solides d'une technologie souveraine, conçue au Sénégal par des techniciens supérieurs sénégalais, au service direct de la sauvegarde des vies et de la dignité des populations vulnérables de Thiaroye-sur-Mer.", "Néanmoins, MBEUND MI pose les bases d'un outil conçu au Sénégal, au service de la sécurité des populations vulnérables de Thiaroye-sur-Mer."]])),
    P("**Recommandations pour les acteurs institutionnels (mairie, ONAS, BNSP).**", { keepNext: true }),
    ...splitLead(blk(266)).slice(1).map((p) => renderP(p)),
    P("**Perspectives d'évolution technique et scientifique.**", { keepNext: true }),
    ...splitLead(clean(blk(267), [["Évolution vers MBEUND BI : Étendre la plateforme vers un outil de prospective d'urbanisme (Business Intelligence territoriale)", "Extension à la planification urbaine : étendre la plateforme vers un outil de prospective (analyse décisionnelle territoriale)"]])).slice(1).map((p) => renderP(p)),
    P("Les perspectives suivantes sont issues de l'audit technique du 6 octobre 2026 :"),
    B("installer de **vrais capteurs** de niveau d'eau et de pluie à Thiaroye-sur-Mer, et ré-entraîner les modèles sur des mesures réelles, notamment pour les niveaux orange et rouge ;"),
    B("mettre en place un **traitement dédié des tâches planifiées** et l'écoute permanente des capteurs sur l'hébergement ;"),
    B("renforcer la **sécurité** (politique de sécurité de contenu, jetons dans des cookies protégés, vérification d'empreinte des modèles) ;"),
    B("ajouter des **tests de bout en bout** automatisés et augmenter la couverture de tests des modules météo, de rejeu historique et de l'interface ;"),
    B("activer l'**envoi de SMS** pour tous les habitants et former des relais de quartier à la vérification des signalements."),
  ];

  // ============================ PAGES DE FIN ============================
  expect(276, 'WEBOGRAPHIE'); expect(307, 'ANNEXES');
  const biblio = [
    H1('Bibliographie et webographie'),
    P("Références au format APA (7e édition). [[Les dates de consultation indiquées sont à confirmer par chaque auteur avant dépôt]]", { align: AlignmentType.LEFT }),
    ...BLOCKS.slice(278, 279).map((b) => renderP(b, { noList: true, hang: true, align: AlignmentType.LEFT, spacing: { after: 80, line: 276 } })),
    P("ARTP (2024). *Observatoire de la téléphonie mobile : situation du marché des communications électroniques, premier trimestre 2024*. Dakar : Autorité de Régulation des Télécommunications et des Postes. [[À compléter : adresse du rapport et date de consultation]]", { align: AlignmentType.LEFT, spacing: { after: 80, line: 276 } }),
    ...BLOCKS.slice(279, 307).map((b) => renderP(b, { noList: true, hang: true, align: AlignmentType.LEFT, spacing: { after: 80, line: 276 } })),
  ];
  // retrait de l'indentation : les entrées sont rendues sans puce ; retrait suspendu appliqué ci-dessous
  expect(310, 'Annexe 1'); expect(313, 'Annexe 2'); expect(347, 'Annexe 3'); expect(350, 'Annexe 4');

  // --- Annexe 2 : dictionnaire de données régénéré à partir des modèles Django (descriptions des auteures reprises quand le champ existe)
  const MODELES = JSON.parse(fs.readFileSync(path.join(__dirname, 'import', 'modeles.json'), 'utf8'));
  const cellText = (c) => norm(c.ps.map((p) => p.runs.map((r) => r.x || '').join('')).join(' '));
  const desc = {}; // table -> champ -> description (reprise)
  const tdesc = {}; // table -> description de la table
  let cur = null;
  for (let i = 315; i < 347; i++) {
    const b = BLOCKS[i];
    if (b.t === 'p') {
      const t = norm(text(b));
      const m = t.match(/^Table\s*:\s*(\S+)/);
      if (m) cur = m[1].replace('api_signalementcitoyen', 'alertes_signalementcitoyen');
      else if (/^Description\s*:/.test(t) && cur) tdesc[cur] = t.replace(/^Description\s*:\s*/, '');
    } else if (cur) {
      desc[cur] = {};
      b.rows.slice(1).forEach((r) => { desc[cur][cellText(r.cells[0])] = cellText(r.cells[2]); });
    }
  }
  const GEO = { alertes_zonerisque: { geom: 'Polygon (SRID 4326)' }, capteurs_capteur: { localisation: 'Point (SRID 4326)' }, alertes_pointrefuge: { localisation: 'Point (SRID 4326)' }, alertes_signalementcitoyen: { localisation: 'Point (SRID 4326)' }, alertes_segmentrue: { geom: 'LineString (SRID 4326)' } };
  const cap1 = (v) => v.charAt(0).toUpperCase() + v.slice(1);
  const annexe2 = [];
  for (const [t, m] of Object.entries(MODELES)) {
    annexe2.push(P('**Table : ' + t + '**', { align: AlignmentType.LEFT, keepNext: true }));
    if (tdesc[t]) annexe2.push(P('*Description : ' + tdesc[t] + '*', { align: AlignmentType.LEFT, keepNext: true }));
    annexe2.push(table(['Nom du champ', 'Type de données', 'Description et rôle'], m.fields.map((f) => {
      const typ = (GEO[t] && GEO[t][f.name]) || f.type;
      const d = (desc[t] && (desc[t][f.name] || desc[t][f.name.replace(/_id$/, '')])) || cap1(f.verbose.replace(/_/g, ' '));
      return [f.name, typ + (f.null ? ' (facultatif)' : ''), d];
    }), [2300, 2500, 4270]));
    annexe2.push(P(''));
  }
  log("Annexe 2 : dictionnaire de données", "Noms de champs et de tables de l'ancienne version (ex. table api_signalementcitoyen, champs geom et hauteur_eau)", "Dictionnaire régénéré à partir des modèles Django actuels (ex. alertes_signalementcitoyen, champs localisation et niveau_eau_estime)", "Les anciens noms ne correspondent pas au code. Les descriptions des auteures sont reprises lorsque le champ existe encore ; sinon l'intitulé du champ est utilisé.");

  // --- Annexe 3 : catalogue des points d'accès tel que défini dans api/urls.py
  const annexe3 = [
    P("Les points d'accès ci-dessous sont ceux du fichier backend/api/urls.py (préfixe /api/), hors routes d'administration."),
    table(['Méthode', "Point d'accès", 'Rôle et conditions'], [
      ['POST', '/api/token/', "Authentification : obtention du jeton d'accès et du jeton de rafraîchissement (JWT)"],
      ['POST', '/api/token/refresh/', "Renouvellement du jeton d'accès"],
      ['GET', '/api/zones/', 'Zones à risque (GeoJSON) avec niveau et score courants'],
      ['GET', '/api/capteurs/', 'Capteurs IoT (liste non paginée)'],
      ['GET', '/api/mesures/', 'Relevés des capteurs (paginé)'],
      ['GET', '/api/alertes/', 'Alertes émises (paginé)'],
      ['GET', '/api/predictions/', "Prédictions de l'intelligence artificielle par zone"],
      ['GET', '/api/previsions/', 'Prévisions météorologiques (paginé)'],
      ['GET', '/api/inondations/', "Épisodes d'inondation historiques"],
      ['GET', '/api/historique-risque/', 'Historique des scores de risque (paginé)'],
      ['GET, POST', '/api/signalements/', 'Liste (paginée) et création de signalements citoyens ; géorepérage à 4 km ; 20 créations par heure et par adresse anonyme'],
      ['GET', '/api/refuges/', 'Points de refuge'],
      ['GET', '/api/segments/', "Tronçons de rue utilisés pour l'itinéraire d'évacuation"],
      ['GET', '/api/itineraire-securise/', "Itinéraire d'évacuation pondéré par le risque (utilisateur authentifié)"],
      ['POST', '/api/chat/', 'Assistant conversationnel NDAM'],
      ['POST', '/api/contacts-alerte/', "Inscription d'un citoyen aux alertes par SMS (liste réservée aux autorités)"],
      ['GET', '/api/export/csv/{type}/', 'Export CSV (autorités et administrateurs)'],
      ['GET', '/api/export/pdf/{type}/', 'Export PDF avec charte graphique (autorités et administrateurs)'],
      ['POST', '/api/sms/inbound/', 'Réception des SMS entrants (signature du fournisseur vérifiée)'],
      ['GET', '/api/docs/', "Documentation interactive de l'API (Swagger, réservée aux administrateurs)"],
      ['WS', '/ws/alertes/', "Canal WebSocket des alertes en temps réel ; jeton transmis par le sous-protocole « mbeund.jwt »"],
    ], [1500, 3200, 4370]),
  ];
  log("Annexe 3 : points d'accès de l'API", "URL de la forme /api/v1/... (ex. /api/v1/meteo/actuelle/, /api/v1/rapports/pdf/, /api/v1/evacuation/itineraire/)", "URL réelles issues de backend/api/urls.py (ex. /api/zones/, /api/itineraire-securise/, /api/export/pdf/{type}/)", "Les URL /api/v1/... n'existent pas dans le code.");

  // --- Annexe 5 : mesures détaillées du modèle de classification du risque (metriques_rf.json)
  const NOMS = ['vert', 'jaune', 'orange', 'rouge'];
  const matrice = (m) => table(['Réel \\ Prédit', ...NOMS], m.matrice_confusion.map((ligne, i) => [NOMS[i], ...ligne.map(String)]), [2270, 1700, 1700, 1700, 1700]);
  const proto = METRIQUES.protocole;
  const annexe5 = [
    H2('Annexe 5 : Mesures détaillées du modèle de classification du risque'),
    P(`Protocole : apprentissage ${proto.train}, test ${proto.test} ; variables d'entrée : ${proto.features.join(', ')} ; cible : ${proto.cible} ; seuils sur le cumul de 72 h : ${proto.seuils_72h_mm.join(', ')} mm ; ${proto.hyperparametres.n_estimators} arbres, au moins ${proto.hyperparametres.min_samples_leaf} exemples par feuille ; calibration : ${proto.calibration}. F1 macro en validation croisée temporelle : ${dec(proto.f1_macro_cv_temporelle, 3)}.`),
    P(`Effectifs d'apprentissage : ${NOMS.map((n) => proto.effectifs_train[n] + ' ' + n + 's').join(', ')}. Effectifs de test : ${NOMS.map((n) => proto.effectifs_test[n] + ' ' + n + 's').join(', ')}.`),
    P('**Matrice de confusion du Random Forest (jeu de test)**', { align: AlignmentType.LEFT, keepNext: true }), matrice(RF), P(''),
    P('**Matrice de confusion du Random Forest calibré (jeu de test)**', { align: AlignmentType.LEFT, keepNext: true }), matrice(RFC), P(''),
    P('**Précision et rappel moyens**', { align: AlignmentType.LEFT, keepNext: true }),
    table(['Modèle', 'Précision macro', 'Rappel macro', 'F1 macro'], [['Persistance', PER], ['Random Forest', RF], ['Random Forest calibré', RFC]].map(([n, m]) => [n, dec(m.precision_macro), dec(m.recall_macro), dec(m.f1_macro)]), [3070, 2000, 2000, 2000]),
    P(''),
  ];

  const annexes = [
    H1('Annexes'),
    ...one(blk(309)),
    H2(norm(text(blk(310)))), ...range(311, 312),
    Hc(2, norm(text(blk(313))), "Dictionnaire régénéré à partir des modèles Django actuels : les tables et champs de la version d'origine (api_signalementcitoyen, geom, hauteur_eau…) n'existaient pas."), ...range(314, 314),
    TODO("À COMPLÉTER PAR MAME DIARRA (tâche R28) : enrichir la colonne « Description et rôle » des champs dont la description n'a pas pu être reprise de la version précédente"),
    ...annexe2,
    Hc(2, norm(text(blk(347))), "Les URL /api/v1/... n'existent pas : remplacées par celles de backend/api/urls.py."), ...annexe3,
    Hc(2, norm(text(blk(350))), "Les extraits d'origine (fonctions et attributs inexistants) sont remplacés par des extraits lus dans le dépôt, avec chemin et numéros de lignes."),
    P("Les extraits suivants sont lus directement dans les fichiers du dépôt (état du 6 octobre 2026), avec leur chemin et leurs numéros de lignes."),
    ...codeExtrait('Extrait 1 : Coût des tronçons et plus court chemin pondéré par le risque (backend/api/services/routing_service.py)', 'backend/api/services/routing_service.py', [[65, 72], [116, 116]]),
    ...codeExtrait("Extrait 2 : Détection des zones d'eau par l'indice NDWI (mbeund_mi_ia/gee/config_gee.py)", 'mbeund_mi_ia/gee/config_gee.py', [[57, 65]]),
    ...codeExtrait("Extrait 3 : Seuil d'activation du modèle dans la tâche planifiée (backend/alertes/tasks.py)", 'backend/alertes/tasks.py', [[28, 30], [286, 292]]),
    ...annexe5,
  ];

  return { intro, ch1, ch2, ch3, ch4, conclusion, biblio, annexes, LOG, BLOCKS, el, one, blk, range, norm };
};
