// Génère Rapport_PFF_MBEUND_MI_v4.docx : contenu du rapport des auteures, page de garde et plan du modèle ISEP-AT n° 2.
// Usage : node v4_build.js sortie.docx   (NODE_PATH doit désigner le dossier node_modules contenant « docx »)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, Footer, PageNumber, NumberFormat, TableOfContents,
  BorderStyle, SequentialIdentifier, LevelFormat, SectionType, LineRuleType, FrameAnchorType, HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom, TextWrappingType, Table, TableRow, TableCell, WidthType, ShadingType,
  CommentRangeStart, CommentRangeEnd, CommentReference,
} = require('docx');
const R = require('./v4_rendu.js');

const FIG = path.join(__dirname, 'fig');
const OUT = process.argv[2];
const CG = 'Century Gothic';
const BRUN = '4A2C1D', OR = 'C89B6D', BRUN2 = '8A6A50', CREME = 'EADBC8';

// ---------- éléments de base ----------
const P = (t, o = {}) => new Paragraph({
  children: R.markup(t, o.run), alignment: o.align ?? AlignmentType.JUSTIFIED, keepNext: o.keepNext, style: o.style, spacing: o.spacing,
});
const H1 = (t, brk = true) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: brk });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const H4 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_4, children: [new TextRun(t)] });
const B = (t) => new Paragraph({ children: R.markup(t), numbering: { reference: 'puces', level: 0 }, alignment: AlignmentType.JUSTIFIED });
const Unnumbered = (t) => new Paragraph({ style: 'TitreLiminaire', children: [new TextRun(t)], pageBreakBefore: true });

// ---------- commentaires Word sur les passages modifiés ----------
let commentaires = [];
const Hc = (niveau, t, texte) => {
  const id = commentaires.length;
  commentaires.push({ id, author: 'Claude (aide à la relecture)', initials: 'CL', date: new Date(), children: [new Paragraph({ children: [new TextRun(texte)] })] });
  const heading = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 }[niveau];
  return new Paragraph({ heading, children: [new CommentRangeStart(id), new TextRun(t), new CommentRangeEnd(id), new TextRun({ children: [new CommentReference(id)] })] });
};
const Uc = (t, texte) => {
  const id = commentaires.length;
  commentaires.push({ id, author: 'Claude (aide à la relecture)', initials: 'CL', date: new Date(), children: [new Paragraph({ children: [new TextRun(texte)] })] });
  return new Paragraph({ style: 'TitreLiminaire', pageBreakBefore: true, children: [new CommentRangeStart(id), new TextRun(t), new CommentRangeEnd(id), new TextRun({ children: [new CommentReference(id)] })] });
};

// ---------- légendes, tableaux (numérotation recalculée, voir passes) ----------
let capLog = [];
function caption(label, texte, source, old) {
  capLog.push({ label, old: old ?? null });
  const items = [new Paragraph({
    style: 'Legende', keepNext: true,
    children: [new TextRun({ text: label + ' ', bold: true }), new SequentialIdentifier(label), new TextRun({ text: ' : ', bold: true }), ...R.markup(texte)],
  })];
  if (source) items.push(new Paragraph({ style: 'Source', children: R.markup('Source : ' + source) }));
  return items;
}
const border = { style: BorderStyle.SINGLE, size: 4, color: OR };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, i, head) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: head ? { fill: CREME, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: String(t).split('\n').map((line) => new Paragraph({ keepNext: rows.length <= 6, spacing: { line: 260, after: 40 }, alignment: AlignmentType.LEFT, children: R.markup(line, { size: 19, bold: head || undefined }) })),
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }))],
  });
}
const tableBlock = (label, title, headers, rows, widths, source) => [
  ...caption('Tableau', title),
  table(headers, rows, widths),
  ...(source ? [new Paragraph({ style: 'Source', children: R.markup('Source : ' + source) })] : []),
  new Paragraph({ children: [] }),
];

const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
  new TextRun({ text: 'ISEP-AT • PFF 2025-2026 ', font: CG, size: 15, color: BRUN2 }),
  new TextRun({ children: [PageNumber.CURRENT], font: CG, size: 15, bold: true, color: OR }),
] })] });

// ======================= PAGE DE GARDE (modèle ISEP-AT n° 2) =======================
// Fond décoratif pleine page, drapeau du Sénégal et logo de l'ISEP-AT côte à côte, textes dans des cadres positionnés.
const cr = (text, o = {}) => new TextRun({ text, font: CG, size: o.size, bold: o.bold, italics: o.italics, color: o.color, characterSpacing: o.sp, highlight: o.hl });
const fr = (x, y, w, h) => ({ position: { x, y }, width: w, height: h, anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE } });
const fp = (frame, runs, o = {}) => new Paragraph({ frame, alignment: o.align ?? AlignmentType.LEFT, spacing: { before: o.before ?? 0, after: o.after ?? 0, line: o.line ?? 240, lineRule: LineRuleType.AT_LEAST }, children: runs });
const F_ENTETE = fr(960, 720, 9984, 1440), F_TITRE = fr(1200, 4800, 9504, 2688), F_THEME = fr(2016, 8496, 8064, 1728);
const F_AUT = fr(1584, 11520, 4128, 2016), F_ENC = fr(6192, 11520, 4128, 2016), F_ANNEE = fr(1584, 15456, 8736, 576);
const floatImg = (file, wPx, hPx, x, y, behind) => new ImageRun({
  type: 'png', data: fs.readFileSync(path.join(FIG, file)), transformation: { width: wPx, height: hPx },
  floating: {
    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: x },
    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: y },
    behindDocument: behind, allowOverlap: true, lockAnchor: false, wrap: { type: TextWrappingType.NONE },
  },
});
// drapeau 180×120 px et logo 190×134 px, centres alignés, écart de 0,5 pouce
const pageDeGarde = [
  new Paragraph({ children: [
    floatImg('cover2_fond.png', 794, 1123, 0, 0, true),
    floatImg('drapeau.png', 180, 120, 1790000, 1694307, false),
    floatImg('logo_isep_modele.png', 190, 134, 3961700, 1627632, false),
  ] }),
  fp(F_ENTETE, [cr('RÉPUBLIQUE DU SÉNÉGAL', { bold: true, color: BRUN, sp: 30, size: 24 })], { align: AlignmentType.CENTER, after: 40 }),
  fp(F_ENTETE, [cr('Un Peuple – Un But – Une Foi', { italics: true, color: BRUN2, size: 18 })], { align: AlignmentType.CENTER, after: 100 }),
  fp(F_ENTETE, [cr('Ministère de l’Enseignement supérieur, de la Recherche et de l’Innovation', { color: BRUN, size: 17 })], { align: AlignmentType.CENTER }),
  fp(F_TITRE, [cr('INSTITUT SUPÉRIEUR D’ENSEIGNEMENT PROFESSIONNEL', { bold: true, color: BRUN, sp: 10, size: 17 })], { align: AlignmentType.CENTER }),
  fp(F_TITRE, [cr('AMADOU TRAWARE DE DIAMNIADIO', { bold: true, color: BRUN, sp: 10, size: 17 })], { align: AlignmentType.CENTER, after: 160 }),
  fp(F_TITRE, [cr('Département : ', { bold: true, color: BRUN2, size: 19 }), cr('TIC', { bold: true, color: BRUN, size: 19 }), cr('   •   ', { color: OR, size: 19 }), cr('Métier : ', { bold: true, color: BRUN2, size: 19 }), cr('APD', { bold: true, color: BRUN, size: 19 })], { align: AlignmentType.CENTER, after: 260 }),
  fp(F_TITRE, [cr('RAPPORT DE PROJET DE FIN DE FORMATION', { bold: true, color: BRUN, sp: 20, size: 34 })], { align: AlignmentType.CENTER, line: 480, after: 80 }),
  fp(F_TITRE, [cr('en vue de l’obtention du Diplôme de l’ISEP (DISEP)', { italics: true, color: BRUN2, size: 19 })], { align: AlignmentType.CENTER }),
  fp(F_THEME, [cr('Thème', { bold: true, color: OR, sp: 40, size: 18 })], { align: AlignmentType.CENTER, after: 160 }),
  fp(F_THEME, [cr('« MBEUND MI : plateforme intelligente de prévention des inondations à Thiaroye-sur-Mer »', { bold: true, color: BRUN, size: 28 })], { align: AlignmentType.CENTER, line: 440 }),
  fp(F_AUT, [cr('Présenté par', { bold: true, color: OR, sp: 20, size: 18 })], { after: 140 }),
  ...['Maïmouna SALL', 'Mame Diarra DIANE', 'Ngoné GUEYE', 'Mama Adam SOUANE'].map((n, i, a) => fp(F_AUT, [cr(n, { color: BRUN, size: 20 })], { after: i === a.length - 1 ? 0 : 60 })),
  fp(F_ENC, [cr('Sous l’encadrement de', { bold: true, color: OR, sp: 20, size: 18 })], { align: AlignmentType.RIGHT, after: 140 }),
  fp(F_ENC, [cr('M. Ahmadou Bamba LO', { color: BRUN, size: 20 })], { align: AlignmentType.RIGHT }),
  fp(F_ENC, [cr('Encadreur pédagogique', { italics: true, color: BRUN2, size: 16 })], { align: AlignmentType.RIGHT }),
  fp(F_ANNEE, [cr('Année académique 2025 – 2026', { bold: true, color: BRUN, sp: 20, size: 22 })], { align: AlignmentType.CENTER }),
  new Paragraph({ children: [] }),
];

// ======================= ASSEMBLAGE =======================
function assemble() {
  capLog = [];
  commentaires = [];
  const corps = require('./v4_corps.js')({ H1, H2, H3, H4, P, B, caption, Unnumbered, tableBlock, table, Hc });
  const { BLOCKS, el, range, one, blk, norm } = corps;
  const text = R.text;

  // ---------- pages liminaires ----------
  const dedicaces = [Unnumbered('DÉDICACES'), ...range(13, 21)];
  const remerciements = [Unnumbered('REMERCIEMENTS'), ...range(23, 27)];
  const resumeFr = [
    Uc('RÉSUMÉ', "Résumé resserré (environ 230 mots au lieu de 390, le plan en demande 200) et mis à jour : les chiffres 87,4 %, 4,2 cm, 153 tests et le « test in-situ » sont remplacés par les mesures du dépôt. Voir CORRECTIONS_RAPPORT.md."),
    P("La commune de Thiaroye-sur-Mer, sur le littoral sud de la presqu'île du Cap-Vert (département de Pikine), subit des inondations récurrentes à chaque saison des pluies : faible altitude, proximité de la mer et de la nappe phréatique, ouvrages d'évacuation insuffisants. Les alertes disponibles sont nationales ou régionales et n'anticipent pas la situation à l'échelle d'un quartier."),
    P("Ce travail présente **MBEUND MI**, plateforme web et mobile de prévention et de gestion des inondations à l'échelle locale. Elle combine des prévisions météorologiques (Open-Meteo), des images satellitaires Sentinel-2 (indice NDWI), des capteurs IoT simulés (MQTT) et des signalements citoyens (application ou SMS). Un classifieur Random Forest estime le niveau de risque et un réseau LSTM prédit le niveau d'eau ; les alertes sont diffusées en temps réel (WebSocket, notifications, SMS), avec un itinéraire d'évacuation et un assistant conversationnel, NDAM. La plateforme repose sur React, Django REST Framework et PostgreSQL/PostGIS."),
    P("Sur le jeu de test 2022-2024, le classifieur atteint une exactitude de 93,5 % mais détecte mal les niveaux orange et rouge, rares, et ne dépasse pas une règle de persistance sur le F1 macro (0,54 contre 0,67). Le LSTM, réentraîné sur 15 ans de pluie, réduit l'erreur de prévision du niveau d'eau de 5,0 à 2,8 cm par rapport à la persistance, sur un niveau reconstitué et non mesuré. Le logiciel est vérifié par 308 tests automatisés. Le projet reste un prototype : capteurs simulés, envoi réel de SMS non validé."),
    P('**Mots-clés :** inondations, Thiaroye-sur-Mer, alerte précoce, SIG, apprentissage automatique, participation citoyenne.'),
  ];
  const abstractEn = [
    Unnumbered('ABSTRACT'),
    P("The municipality of Thiaroye-sur-Mer, on the southern coast of the Cap-Vert peninsula (Pikine department), suffers recurrent flooding every rainy season: low elevation, proximity of the sea and of the water table, and insufficient stormwater drainage. Available warnings are national or regional and cannot anticipate conditions at neighbourhood scale."),
    P("This work presents **MBEUND MI**, a web and mobile platform for local-scale flood prevention and management. It combines weather forecasts (Open-Meteo), Sentinel-2 satellite imagery (NDWI index), simulated IoT sensors (MQTT) and citizen reports (application or SMS). A Random Forest classifier estimates the risk level and an LSTM network forecasts water level; alerts are issued in real time (WebSocket, notifications, SMS), with an evacuation route and a conversational assistant, NDAM. The platform is built with React, Django REST Framework and PostgreSQL/PostGIS."),
    P("On the 2022-2024 test set, the classifier reaches an accuracy of 93.5% but poorly detects the rare orange and red levels and does not beat a persistence rule on macro F1 (0.54 against 0.67). The LSTM, retrained on 15 years of rainfall, reduces the water-level forecast error from 5.0 to 2.8 cm compared with persistence, on a reconstructed rather than measured level. The software is verified by 308 automated tests. The project remains a prototype: sensors are simulated and real SMS delivery is not yet validated."),
    P('**Keywords:** flooding, Thiaroye-sur-Mer, early warning, GIS, machine learning, citizen participation.'),
  ];
  const sommaire = [Unnumbered('SOMMAIRE'), new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-2' })];
  const sigles = [Unnumbered('LISTE DES SIGLES ET ABRÉVIATIONS'), R.renderTable(BLOCKS[48]), new Paragraph({ children: [] })];
  const listesFT = [
    Unnumbered('LISTE DES FIGURES'), new TableOfContents('Liste des figures', { hyperlink: true, captionLabelIncludingNumbers: 'Figure' }),
    Unnumbered('LISTE DES TABLEAUX'), new TableOfContents('Liste des tableaux', { hyperlink: true, captionLabelIncludingNumbers: 'Tableau' }),
  ];
  const tdm = [Unnumbered('TABLE DES MATIÈRES DÉTAILLÉE'), new TableOfContents('Table des matières détaillée', { hyperlink: true, headingStyleRange: '1-4' })];

  const liminaires = [...dedicaces, ...remerciements, ...resumeFr, ...abstractEn, ...sommaire, ...sigles, ...listesFT];
  const body = [...corps.intro, ...corps.ch1, ...corps.ch2, ...corps.ch3, ...corps.ch4, ...corps.conclusion, ...corps.biblio, ...corps.annexes, ...tdm];
  return { liminaires, body, log: corps.LOG };
}

// passe 1 : ordre réel des légendes ; passe 2 : renvois recalculés
const pass1 = assemble();
const order = { Figure: [], Tableau: [] };
capLog.forEach((c) => order[c.label].push(c.old));
const refMap = { figure: {}, tableau: {} };
for (const lab of ['Figure', 'Tableau']) order[lab].forEach((old, k) => { if (old != null) refMap[lab.toLowerCase()][old] = k + 1; });
R.setRefFix((t) => t.replace(/\b(figures?|tableaux?)(\s+)(\d+)((?:\s*(?:et|à)\s*)(\d+))?/gi, (m, lab, sp, n1, rest, n2) => {
  const key = lab.toLowerCase().startsWith('fig') ? 'figure' : 'tableau';
  const f = (n) => refMap[key][n] ?? n;
  return lab + sp + f(parseInt(n1, 10)) + (rest ? rest.replace(/\d+$/, String(f(parseInt(n2, 10)))) : '');
}));
const { liminaires, body, log } = assemble();
console.log('légendes :', 'figures', order.Figure.length, 'tableaux', order.Tableau.length);

// ======================= DOCUMENT =======================
const MARGIN0 = { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 };
const PAGE = { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } };
const doc = new Document({
  creator: 'Maïmouna SALL, Mame Diarra DIANE, Ngoné GUEYE, Mama Adam SOUANE',
  title: 'MBEUND MI : rapport de Projet de Fin de Formation (PFF 2025-2026)',
  features: { updateFields: true },
  comments: { children: commentaires },
  styles: {
    default: { document: { run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { line: 360, after: 120 } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: CG, size: 32, bold: true, color: BRUN },
        paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 240, after: 280 }, outlineLevel: 0, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: OR, space: 6 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: CG, size: 26, bold: true, color: BRUN2 }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: CG, size: 23, bold: true, color: BRUN }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 2 } },
      { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: CG, size: 21, bold: true, italics: true, color: BRUN }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 3 } },
      { id: 'TitreLiminaire', name: 'Titre liminaire', basedOn: 'Normal', next: 'Normal', run: { font: CG, size: 32, bold: true, color: BRUN, characterSpacing: 20 }, paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 240, after: 280 }, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: OR, space: 6 } } } },
      { id: 'Legende', name: 'Caption', basedOn: 'Normal', next: 'Normal', run: { size: 20, italics: true, color: BRUN }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 60, after: 40, line: 260 } } },
      { id: 'Source', name: 'Source', basedOn: 'Normal', next: 'Normal', run: { size: 18, color: '555555' }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 200, line: 240 } } },
      { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', next: 'Normal', run: { font: CG, bold: true, color: BRUN, size: 21 }, paragraph: { spacing: { before: 100, after: 30, line: 250 } } },
      { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', next: 'Normal', run: { font: 'Calibri', color: '3A2A20', size: 21 }, paragraph: { spacing: { after: 20, line: 250 }, indent: { left: 360 } } },
      { id: 'TOC3', name: 'toc 3', basedOn: 'Normal', next: 'Normal', run: { font: 'Calibri', color: '3A2A20', size: 20 }, paragraph: { spacing: { after: 20, line: 264 }, indent: { left: 720 } } },
      { id: 'TOC4', name: 'toc 4', basedOn: 'Normal', next: 'Normal', run: { font: 'Calibri', color: '3A2A20', size: 19 }, paragraph: { spacing: { after: 20, line: 264 }, indent: { left: 1080 } } },
    ],
  },
  numbering: { config: [
    { reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [
    { properties: { page: { size: PAGE.size, margin: MARGIN0 } }, children: pageDeGarde },
    { properties: { type: SectionType.NEXT_PAGE, page: { ...PAGE, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } }, footers: { default: footer }, children: liminaires },
    { properties: { type: SectionType.NEXT_PAGE, page: { ...PAGE, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } }, footers: { default: footer }, children: body },
  ],
});
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('écrit', OUT, buf.length);
});
