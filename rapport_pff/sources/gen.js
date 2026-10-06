const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, PageBreak, Footer, PageNumber, NumberFormat, TableOfContents, BorderStyle,
  SequentialIdentifier, LevelFormat, VerticalAlign, SectionType,
} = require('docx');

const FIG = path.join(__dirname, 'fig');
const OUT = process.argv[2];
const CONTENT_W = 9070; // A4 - 2 x 2,5 cm

// ---------- mini-balisage : **gras**, *italique*, [[à vérifier]] (surligné jaune)
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\])/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith('[[')) out.push(new TextRun({ text: '[' + t.slice(2, -2) + ']', highlight: 'yellow', italics: true, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run), alignment: o.align ?? AlignmentType.JUSTIFIED, spacing: o.spacing, indent: o.indent, keepNext: o.keepNext });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: true });
const H1np = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const H4 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_4, children: [new TextRun(t)] });
const B = (t) => new Paragraph({ children: runs(t), numbering: { reference: 'puces', level: 0 }, alignment: AlignmentType.JUSTIFIED });
const N = (t, ref = 'num') => new Paragraph({ children: runs(t), numbering: { reference: ref, level: 0 }, alignment: AlignmentType.JUSTIFIED });
const brk = () => new Paragraph({ children: [new PageBreak()] });
const Unnumbered = (t) => new Paragraph({ style: 'TitreLiminaire', children: [new TextRun(t)], pageBreakBefore: true });

function caption(label, text, source) {
  const items = [new Paragraph({
    style: 'Legende', keepNext: true,
    children: [new TextRun({ text: label + ' ', bold: true }), new SequentialIdentifier(label), new TextRun({ text: ' : ', bold: true }), ...runs(text)],
  })];
  if (source) items.push(new Paragraph({ style: 'Source', children: runs('Source : ' + source) }));
  return items;
}
function img(file, wPx, hPx) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(FIG, file)), transformation: { width: wPx, height: hPx } })],
  });
}
function figure(file, w, h, label, text, source) { return [img(file, w, h), ...caption('Figure', text, source)]; }

const border = { style: BorderStyle.SINGLE, size: 4, color: '8A9BA5' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, i, head) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: head ? { fill: 'DCE8EC', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: String(t).split('\n').map((line) => new Paragraph({ keepNext: true, spacing: { line: 260, after: 40 }, alignment: AlignmentType.LEFT, children: runs(line, { size: 19, bold: head || undefined }) })),
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }))],
  });
}
const tableBlock = (label, title, headers, rows, widths, source) => [...caption('Tableau', title).map((p) => p), table(headers, rows, widths), ...(source ? [new Paragraph({ style: 'Source', children: runs('Source : ' + source) })] : []), new Paragraph({ children: [] })];

const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] });

// ======================= PAGE DE GARDE =======================
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const nb = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const c = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 40, line: 260 }, children: [new TextRun({ text: t, bold: o.bold, size: o.size ?? 22, color: o.color, italics: o.italics })] });

const enTete = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [4535, 4535],
  rows: [new TableRow({ children: [
    new TableCell({ borders: nb, width: { size: 4535, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, children: [
      c('RÉPUBLIQUE DU SÉNÉGAL', { bold: true, size: 22 }),
      c('Un Peuple – Un But – Une Foi', { italics: true, size: 20 }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(FIG, 'drapeau.png')), transformation: { width: 135, height: 90 } })] }),
      c("Ministère de l'Enseignement supérieur, de la Recherche et de l'Innovation", { size: 18 }),
    ] }),
    new TableCell({ borders: nb, width: { size: 4535, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(FIG, 'logo_isep.png')), transformation: { width: 245, height: 188 } })] }),
    ] }),
  ] })],
});
const themeBox = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
  rows: [new TableRow({ children: [new TableCell({
    width: { size: CONTENT_W, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.DOUBLE, size: 6, color: '4A2F1F' }, bottom: { style: BorderStyle.DOUBLE, size: 6, color: '4A2F1F' }, left: { style: BorderStyle.DOUBLE, size: 6, color: '4A2F1F' }, right: { style: BorderStyle.DOUBLE, size: 6, color: '4A2F1F' } },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    children: [
      c('THÈME', { bold: true, size: 22, color: '4A2F1F', after: 120 }),
      c('MBEUND MI : PLATEFORME INTELLIGENTE DE PRÉVENTION ET DE GESTION DES INONDATIONS À L\'ÉCHELLE LOCALE', { bold: true, size: 30, after: 120 }),
      c('Cas de la commune de Thiaroye-sur-Mer (Pikine, Dakar)', { italics: true, size: 24 }),
    ],
  })] })],
});
const auteurs = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [4535, 4535],
  rows: [new TableRow({ children: [
    new TableCell({ borders: nb, width: { size: 4535, type: WidthType.DXA }, children: [
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Présenté et soutenu par', bold: true, underline: {}, size: 22 })] }),
      ...['Maïmouna SALL', 'Mame Diarra DIANE', 'Ngoné GUEYE', 'Mama Adam SOUANE'].map((n) => new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: n, size: 22 })] })),
    ] }),
    new TableCell({ borders: nb, width: { size: 4535, type: WidthType.DXA }, children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: 'Sous l\'encadrement de', bold: true, underline: {}, size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'M. Ahmadou Bamba LO', size: 22 })] }),
    ] }),
  ] })],
});
const pageDeGarde = [
  enTete,
  new Paragraph({ spacing: { before: 200 }, children: [] }),
  c("Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Traware", { bold: true, size: 24 }),
  c('Filière : Analyse de Performance Digital (APD)', { size: 22, after: 240 }),
  c('RAPPORT DE PROJET DE FIN DE FORMATION (PFF)', { bold: true, size: 28 }),
  c("En vue de l'obtention du Diplôme de l'Institut Supérieur d'Enseignement Professionnel (DISEP)", { italics: true, size: 21, after: 300 }),
  themeBox,
  new Paragraph({ spacing: { before: 400 }, children: [] }),
  auteurs,
  new Paragraph({ spacing: { before: 500 }, children: [] }),
  c('Années académiques : 2024-2025 / 2025-2026', { bold: true, size: 24 }),
];

// ======================= LIMINAIRES =======================
const dedicaces = [
  Unnumbered('DÉDICACES'),
  P('[[À compléter par chaque auteure : une dédicace personnelle de 3 à 6 lignes, signée. Exemple de forme ci-dessous, à remplacer.]]'),
  ...['Maïmouna SALL', 'Mame Diarra DIANE', 'Ngoné GUEYE', 'Mama Adam SOUANE'].flatMap((n) => [
    P('Je dédie ce travail à … [[texte personnel]]', { spacing: { before: 240 } }),
    P('— ' + n, { align: AlignmentType.RIGHT, run: { italics: true } }),
  ]),
];

const remerciements = [
  Unnumbered('REMERCIEMENTS'),
  P('Au terme de ce travail, nous rendons grâce à Dieu, qui nous a donné la santé, la force et la persévérance nécessaires pour le mener à bien.'),
  P("Nous exprimons notre profonde gratitude à notre encadreur, **M. Ahmadou Bamba LO**, pour sa disponibilité, la justesse de ses orientations et l'exigence avec laquelle il a suivi chacune des étapes de ce projet."),
  P("Nos remerciements s'adressent à la Direction de l'ISEP Amadou Traware, à la coordination et à l'ensemble des formateurs de la filière Analyse de Performance Digital (APD), pour la qualité de la formation reçue et pour l'accompagnement apporté tout au long de notre parcours."),
  P("Nous remercions chaleureusement les habitants de Thiaroye-sur-Mer qui nous ont accueillies lors de notre enquête de terrain du 15 mai 2026, et en particulier **M. Mor Gueye**, **Monsieur Gueye**, ainsi que **M. Papa Yalli** et les membres du mouvement de quartier qu'il anime. Leurs témoignages ont donné à ce travail son ancrage dans la réalité vécue des inondations."),
  P('Nous remercions enfin nos familles, pour leur soutien constant, nos camarades de promotion, pour leur entraide, ainsi que les membres du jury, qui ont accepté d\'évaluer ce travail.'),
];

const avantPropos = [
  Unnumbered('AVANT-PROPOS'),
  P("Les Instituts Supérieurs d'Enseignement Professionnel (ISEP) forment un réseau d'établissements publics d'enseignement supérieur créé par l'État du Sénégal pour proposer des formations professionnalisantes courtes, ancrées dans les besoins des territoires et du marché de l'emploi. Ces formations sont sanctionnées par le Diplôme de l'Institut Supérieur d'Enseignement Professionnel (DISEP). [[À compléter : date de création et localisation de l'ISEP Amadou Traware, présentation en deux phrases de la filière APD.]]"),
  P("Le Projet de Fin de Formation (PFF) constitue l'exercice de synthèse du cursus. Il amène les étudiants à mobiliser l'ensemble des compétences acquises (analyse de données, développement web, conduite de projet, communication) pour répondre à un problème réel, puis à rendre compte de leur démarche dans un rapport soutenu devant un jury."),
  P("Le présent rapport rend compte du projet **MBEUND MI**, plateforme numérique de prévention et de gestion des inondations conçue pour la commune de Thiaroye-sur-Mer. Le projet a été conduit en équipe de quatre, avec la répartition suivante :"),
  B('**Maïmouna SALL** : coordination, intelligence artificielle, services de données et intégration de l\'API ;'),
  B('**Mama Adam SOUANE** : développement du backend (Django REST Framework) et infrastructure ;'),
  B('**Mame Diarra DIANE** : conception et administration de la base de données spatiale (PostgreSQL/PostGIS) ;'),
  B('**Ngoné GUEYE** : développement de l\'interface web et mobile (React, Leaflet).'),
  P('[[À vérifier par l\'équipe : la répartition des rôles ci-dessus reprend le dossier interne du projet.]]'),
];

const resume = [
  Unnumbered('RÉSUMÉ'),
  P("La commune de Thiaroye-sur-Mer, située sur le littoral sud de la presqu'île du Cap-Vert (département de Pikine), subit des inondations récurrentes à chaque saison des pluies. Sa faible altitude, la proximité de la mer et de la nappe phréatique, ainsi que l'insuffisance des ouvrages d'évacuation des eaux pluviales exposent fortement ses habitants. Les alertes disponibles restent nationales ou régionales et ne permettent pas d'anticiper la situation à l'échelle d'un quartier."),
  P("Ce travail présente **MBEUND MI**, une plateforme web et mobile de prévention et de gestion des inondations à l'échelle locale. Elle combine des données météorologiques (Open-Meteo), des images satellitaires Sentinel-2 traitées par indice NDWI sur Google Earth Engine, des mesures de capteurs IoT simulés transmises par MQTT et des signalements citoyens envoyés par l'application ou par SMS. Un classifieur Random Forest calibré estime le niveau de risque (vert, jaune, orange, rouge) et un réseau LSTM prédit le niveau d'eau. La plateforme diffuse des alertes en temps réel (WebSocket, notifications push, SMS), propose un itinéraire d'évacuation vers un refuge et intègre un assistant conversationnel, NDAM. Elle repose sur React et Leaflet pour l'interface, Django REST Framework pour l'API et PostgreSQL/PostGIS pour les données. Une enquête de terrain menée le 15 mai 2026 à Thiaroye-sur-Mer a permis de confronter la conception aux réalités vécues par les habitants."),
  P('[[Phrase de résultats à compléter après le chapitre IV : métriques du modèle, résultats des tests, principaux enseignements.]]'),
  P('**Mots-clés :** inondations urbaines et côtières, Thiaroye-sur-Mer, système d\'alerte précoce, SIG, PostGIS, apprentissage automatique, participation citoyenne, Django REST Framework, React.'),
  Unnumbered('ABSTRACT'),
  P("The municipality of Thiaroye-sur-Mer, on the southern coast of the Cap-Vert peninsula (Pikine department, Dakar), suffers recurrent flooding every rainy season. Its low elevation, the proximity of the sea and of the water table, and insufficient stormwater drainage leave residents highly exposed. Available warnings are national or regional and cannot anticipate conditions at neighbourhood scale."),
  P("This work presents **MBEUND MI**, a web and mobile platform for local-scale flood prevention and management. It combines weather data (Open-Meteo), Sentinel-2 satellite imagery processed with the NDWI index on Google Earth Engine, simulated IoT sensor readings sent over MQTT, and citizen reports submitted through the application or by SMS. A calibrated Random Forest classifier estimates the risk level (green, yellow, orange, red) and an LSTM network forecasts water level. The platform issues real-time alerts (WebSocket, push notifications, SMS), computes an evacuation route to a shelter and includes a conversational assistant, NDAM. It is built with React and Leaflet, Django REST Framework and PostgreSQL/PostGIS. A field survey carried out on 15 May 2026 in Thiaroye-sur-Mer grounded the design in residents' lived experience."),
  P('[[Results sentence to be added after chapter IV.]]'),
  P('**Keywords:** urban and coastal flooding, Thiaroye-sur-Mer, early warning system, GIS, PostGIS, machine learning, citizen participation, Django REST Framework, React.'),
];

const sigles = [
  ['ADM', 'Agence de Développement Municipal'], ['ANACIM', "Agence Nationale de l'Aviation Civile et de la Météorologie"],
  ['ANSD', 'Agence Nationale de la Statistique et de la Démographie'], ['API', "Application Programming Interface (interface de programmation)"],
  ['APD', 'Analyse de Performance Digital'], ['BNSP', 'Brigade Nationale des Sapeurs-Pompiers'],
  ['DISEP', "Diplôme de l'Institut Supérieur d'Enseignement Professionnel"], ['DPC', 'Direction de la Protection Civile'],
  ['GEE', 'Google Earth Engine'], ['GRC', 'Gestion des Risques de Catastrophes'],
  ['IoT', 'Internet of Things (Internet des objets)'], ['ISEP', "Institut Supérieur d'Enseignement Professionnel"],
  ['JWT', 'JSON Web Token'], ['LSTM', 'Long Short-Term Memory (réseau de neurones récurrent)'],
  ['MQTT', 'Message Queuing Telemetry Transport'], ['NDWI', 'Normalized Difference Water Index'],
  ['ONAS', "Office National de l'Assainissement du Sénégal"], ['ORSEC', 'Organisation des secours (plan d\'urgence)'],
  ['OSM', 'OpenStreetMap'], ['PDNA', 'Post-Disaster Needs Assessment (évaluation des besoins post-catastrophe)'],
  ['PFF', 'Projet de Fin de Formation'], ['PROGEP', "Projet de Gestion des Eaux Pluviales et d'adaptation au changement climatique"],
  ['RF', 'Random Forest (forêt aléatoire)'], ['RGPH', "Recensement Général de la Population et de l'Habitat"],
  ['SAP', "Système d'Alerte Précoce"], ['SIG', "Système d'Information Géographique"],
  ['SMS', 'Short Message Service'], ['UML', 'Unified Modeling Language'], ['WGS 84', 'World Geodetic System 1984 (système de coordonnées, EPSG:4326)'],
];
const listeSigles = [Unnumbered('LISTE DES SIGLES ET ABRÉVIATIONS'), table(['Sigle', 'Signification'], sigles, [1800, 7270])];

const listes = [
  Unnumbered('LISTE DES FIGURES'),
  new TableOfContents('Liste des figures', { hyperlink: true, captionLabelIncludingNumbers: 'Figure' }),
  Unnumbered('LISTE DES TABLEAUX'),
  new TableOfContents('Liste des tableaux', { hyperlink: true, captionLabelIncludingNumbers: 'Tableau' }),
  Unnumbered('SOMMAIRE'),
  new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-3' }),
];

// ======================= INTRODUCTION =======================
const intro = require('./intro.js')({ H1np, H2, H4, P, B, N, tableBlock });

// ======================= CHAPITRE I (étape suivante) =======================
const chap1 = require('./chap1.js')({ H1, H2, H3, H4, P, B, figure, tableBlock });

// ======================= CHAPITRE II =======================
const chap2 = require('./chap2.js')({ H1, H2, H3, H4, P, B, figure, tableBlock });

const suite = [
  ...require('./chap3.js')({ H1, H2, H3, H4, P, B, figure, tableBlock }),
  H1('CHAPITRE IV : CADRE ANALYTIQUE ET RÉALISATION'),
  P('[[ÉTAPE 4 : chapitre en cours de réécriture (données, interfaces, résultats et vérification des hypothèses, recommandations).]]'),
  H1('CONCLUSION GÉNÉRALE'),
  P('[[ÉTAPE 4 : à rédiger une fois les résultats du chapitre IV établis.]]'),
  H1('WEBOGRAPHIE'),
  P("Références citées de l'introduction au chapitre II. La liste sera complétée à l'étape 4. Les dates de consultation surlignées sont à renseigner."),
  B("ANSD (2024). *Cinquième Recensement général de la population et de l'habitat (RGPH-5), 2023 : rapport des résultats*. Dakar : Agence Nationale de la Statistique et de la Démographie. https://www.ansd.sn [[consulté le … ; vérifier le titre exact]]"),
  B("Assemblée générale des Nations Unies (2016). *Rapport du groupe de travail intergouvernemental d'experts à composition non limitée chargé des indicateurs et de la terminologie relatifs à la réduction des risques de catastrophe* (A/71/644). New York : Nations Unies."),
  B("Banque mondiale. *Projet de Gestion des Eaux Pluviales et d'adaptation au changement climatique (PROGEP), Sénégal*. https://projects.worldbank.org [[vérifier le titre, l'identifiant du projet et les dates]]"),
  B('Breiman, L. (2001). Random Forests. *Machine Learning*, 45(1), 5-32.'),
  B('Copernicus Emergency Management Service. *Global Flood Awareness System (GloFAS)*. https://global-flood.emergency.copernicus.eu [[consulté le …]]'),
  B("FANFAR. *Système de prévision et d'alerte des crues pour l'Afrique de l'Ouest*. https://fanfar.eu [[consulté le … ; vérifier]]"),
  B("GIEC (2021). *Changement climatique 2021 : les bases scientifiques physiques. Résumé à l'intention des décideurs*. Contribution du Groupe de travail I au sixième rapport d'évaluation. Genève : GIEC."),
  B('Goodchild, M. F. (2007). Citizens as sensors: the world of volunteered geography. *GeoJournal*, 69(4), 211-221.'),
  B("Google Research. *Flood Hub*. https://sites.research.google/floods [[consulté le … ; vérifier l'adresse]]"),
  B('Gorelick, N., Hancher, M., Dixon, M., Ilyushchenko, S., Thau, D., & Moore, R. (2017). Google Earth Engine: Planetary-scale geospatial analysis for everyone. *Remote Sensing of Environment*, 202, 18-27.'),
  B("Gouvernement du Sénégal, Banque mondiale, Système des Nations Unies, Commission européenne (2010). *Rapport d'évaluation des besoins post-catastrophe : inondations urbaines à Dakar 2009*. [[À VÉRIFIER]]"),
  B('Hochreiter, S., & Schmidhuber, J. (1997). Long Short-Term Memory. *Neural Computation*, 9(8), 1735-1780.'),
  B('Kratzert, F., Klotz, D., Brenner, C., Schulz, K., & Herrnegger, M. (2018). Rainfall-runoff modelling using Long Short-Term Memory (LSTM) networks. *Hydrology and Earth System Sciences*, 22(11), 6005-6022.'),
  B('Longley, P. A., Goodchild, M. F., Maguire, D. J., & Rhind, D. W. (2005). *Geographic Information Systems and Science* (2e éd.). Chichester : John Wiley & Sons.'),
  B('McFeeters, S. K. (1996). The use of the Normalized Difference Water Index (NDWI) in the delineation of open water features. *International Journal of Remote Sensing*, 17(7), 1425-1432.'),
  B('Nearing, G., Cohen, D., Dube, V., et al. (2024). Global prediction of extreme floods in ungauged watersheds. *Nature*, 627, 559-563.'),
  B('OMM (2018). *Multi-hazard Early Warning Systems: A Checklist*. Genève : Organisation météorologique mondiale.'),
  B('OMM (2022). *Early Warnings for All: Executive Action Plan 2023-2027*. Genève : Organisation météorologique mondiale.'),
  B("Open-Meteo (2026). *Historical Weather API*. https://open-meteo.com/en/docs/historical-weather-api [[consulté le … ; date d'extraction des données du projet]]"),
  B('OpenStreetMap, contributeurs (2026). *Carte de Thiaroye-sur-Mer et service de géocodage Nominatim*. https://www.openstreetmap.org (consulté le 2 octobre 2026).'),
  B("Ramani Huria. *Community mapping for flood resilience in Dar es Salaam*. https://ramanihuria.org [[consulté le … ; vérifier l'adresse]]"),
  B('Rambaldi, G., Kwaku Kyem, P. A., McCall, M., & Weiner, D. (2006). Participatory spatial information management and communication in developing countries. *Electronic Journal of Information Systems in Developing Countries*, 25(1), 1-9.'),
  B('République du Sénégal (2013). *Loi n° 2013-10 du 28 décembre 2013 portant Code général des collectivités locales*. Journal officiel. [[À VÉRIFIER]]'),
  B('Saaty, T. L. (1980). *The Analytic Hierarchy Process*. New York : McGraw-Hill.'),
  B('Tehrany, M. S., Pradhan, B., & Jebur, M. N. (2014). Flood susceptibility mapping using a novel ensemble weights-of-evidence and support vector machine models in GIS. *Journal of Hydrology*, 512, 332-343.'),
  B("UNISDR (2006). *Developing Early Warning Systems: A Checklist*. Troisième conférence internationale sur l'alerte précoce, Bonn. Genève : Nations Unies."),
  B('UNISDR (2015). *Cadre de Sendai pour la réduction des risques de catastrophe 2015-2030*. Genève : Nations Unies.'),
  B('Ushahidi. *Plateforme libre de collecte et de cartographie de signalements*. https://www.ushahidi.com [[consulté le …]]'),
  B('Xu, H. (2006). Modification of normalised difference water index (NDWI) to enhance open water features in remotely sensed imagery. *International Journal of Remote Sensing*, 27(14), 3025-3033.'),
  H1('ANNEXES'),
  P('[[ÉTAPE 4 : guide d\'entretien de l\'enquête de terrain, dictionnaire de données, liste des points d\'accès de l\'API, extraits de code, guide utilisateur.]]'),
  P('**Annexe 1 (proposition) : coordonnées GPS des points d\'enquête du 15 mai 2026**'),
  table(['Point', 'Enquêté', 'Latitude', 'Longitude', 'Plus Code'], [
    ['1', 'Mor Gueye (quartier Ibra Ndoye)', '14,742343', '-17,374692', 'PJRG+W4M Pikine'],
    ['2', 'Habitants (près de Mbatal)', '14,741323', '-17,376986', 'PJRF+G6C Pikine'],
    ['3', 'Monsieur Gueye', '14,743156', '-17,376470', 'PJVF+7C6 Pikine'],
  ], [800, 3070, 1600, 1700, 1900]),
];

// ======================= DOCUMENT =======================
const doc = new Document({
  creator: 'Maïmouna SALL, Mame Diarra DIANE, Ngoné GUEYE, Mama Adam SOUANE',
  title: 'MBEUND MI : rapport de Projet de Fin de Formation',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { line: 360, after: 120 } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: '4A2F1F' }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 27, bold: true, color: '0F5D73' }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 25, bold: true, italics: true }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 2 } },
      { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 3 } },
      { id: 'TitreLiminaire', name: 'Titre liminaire', basedOn: 'Normal', next: 'Normal', run: { size: 30, bold: true, color: '4A2F1F' }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 } } },
      { id: 'Legende', name: 'Caption', basedOn: 'Normal', next: 'Normal', run: { size: 20, italics: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 60, after: 40, line: 260 } } },
      { id: 'Source', name: 'Source', basedOn: 'Normal', next: 'Normal', run: { size: 18, color: '555555' }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 200, line: 240 } } },
    ],
  },
  numbering: { config: [
    { reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'qs', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: 'QS%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 540 } } } }] },
    { reference: 'os', levels: [{ level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1418, right: 1418 } } }, children: pageDeGarde },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 }, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } }, footers: { default: footer },
      children: [...dedicaces, ...remerciements, ...avantPropos, ...resume, ...listeSigles, ...listes] },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } }, footers: { default: footer },
      children: [...intro, ...chap1, ...chap2, ...suite] },
  ],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log('écrit', OUT, buf.length); });
