
// ======================= PAGE DE GARDE (modèle ISEP-AT) =======================
// Fond pleine page + textes dans des cadres positionnés en absolu, comme dans le modèle officiel.
const cr = (text, o = {}) => new TextRun({ text, font: CG, size: o.size, bold: o.bold, italics: o.italics, color: o.color, characterSpacing: o.sp, highlight: o.hl });
const fr = (x, y, w, h) => ({ position: { x, y }, width: w, height: h, anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE } });
const fp = (frame, runs, o = {}) => new Paragraph({ frame, alignment: o.align ?? AlignmentType.LEFT, spacing: { before: o.before ?? 0, after: o.after ?? 0, line: o.line ?? 240, lineRule: LineRuleType.AT_LEAST }, children: runs });
const F_ENTETE = fr(1008, 720, 8160, 1824), F_TITRE = fr(1200, 6432, 9504, 2880), F_THEME = fr(2016, 9648, 7968, 1968);
const F_AUTEURS = fr(1920, 12480, 3744, 1488), F_ENCADR = fr(6432, 12480, 3744, 1488), F_ANNEE = fr(3360, 15600, 7680, 960);
const floatImg = (file, wPx, hPx, x, y, behind) => new ImageRun({
  type: 'png', data: fs.readFileSync(path.join(FIG, file)), transformation: { width: wPx, height: hPx },
  floating: {
    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: x },
    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: y },
    behindDocument: behind, allowOverlap: true, lockAnchor: false, wrap: { type: TextWrappingType.NONE },
  },
});
const pageDeGarde = [
  new Paragraph({ children: [floatImg('cover_fond.png', 794, 1123, 0, 0, true), floatImg('logo_isep_modele.png', 166, 117, 2990088, 2673096, false)] }),
  fp(F_ENTETE, [cr('RÉPUBLIQUE DU SÉNÉGAL', { bold: true, color: 'FFFFFF', sp: 40, size: 26 })], { after: 40 }),
  fp(F_ENTETE, [cr('Un Peuple • Un But • Une Foi', { italics: true, color: 'E2BA8C', size: 18 })], { after: 120 }),
  fp(F_ENTETE, [cr('Ministère de l’Enseignement supérieur, de la Recherche et de l’Innovation', { color: 'EADBC8', size: 16 })]),
  fp(F_TITRE, [cr('INSTITUT SUPÉRIEUR D’ENSEIGNEMENT PROFESSIONNEL AMADOU TRAWARE DE DIAMNIADIO', { bold: true, color: '4A2C1D', sp: 10, size: 15 })], { align: AlignmentType.CENTER, after: 120 }),
  fp(F_TITRE, [cr('Filière : ', { bold: true, color: '8A6A50', size: 18 }), cr('Analyse de Performance Digital (APD)', { color: '8A6A50', size: 18 }), cr(' | ', { color: 'C89B6D', size: 18 }), cr('Option : ', { bold: true, color: '8A6A50', size: 18 }), cr('[à compléter]', { color: '8A6A50', size: 18, hl: 'yellow' })], { align: AlignmentType.CENTER, after: 220 }),
  fp(F_TITRE, [cr('RAPPORT DE PROJET', { bold: true, color: '4A2C1D', sp: 30, size: 44 })], { align: AlignmentType.CENTER, line: 620 }),
  fp(F_TITRE, [cr('DE FIN DE FORMATION', { bold: true, color: 'C89B6D', sp: 30, size: 44 })], { align: AlignmentType.CENTER, line: 620, after: 120 }),
  fp(F_TITRE, [cr('en vue de l’obtention du Diplôme de l’Institut Supérieur d’Enseignement Professionnel (DISEP)', { italics: true, color: '8A6A50', size: 18 })], { align: AlignmentType.CENTER }),
  fp(F_THEME, [cr('THÈME DU PROJET', { bold: true, color: 'C89B6D', sp: 60, size: 16 })], { before: 60, after: 180 }),
  fp(F_THEME, [cr('« MBEUND MI : plateforme intelligente de prévention des inondations à Thiaroye-sur-Mer »', { bold: true, color: '4A2C1D', size: 28 })], { line: 440 }),
  fp(F_AUTEURS, [cr('PRÉSENTÉ PAR', { bold: true, color: 'C89B6D', sp: 60, size: 15 })], { after: 100 }),
  ...['Maïmouna SALL', 'Mame Diarra DIANE', 'Ngoné GUEYE', 'Mama Adam SOUANE'].map((n, i, a) => fp(F_AUTEURS, [new TextRun({ text: '▸ ', font: 'Segoe UI Symbol', color: 'C89B6D', size: 17 }), cr(n, { bold: true, color: '4A2C1D', size: 18 })], { after: i === a.length - 1 ? 0 : 30 })),
  fp(F_ENCADR, [cr('SOUS L’ENCADREMENT DE', { bold: true, color: 'C89B6D', sp: 60, size: 15 })], { after: 100 }),
  fp(F_ENCADR, [cr('M. Ahmadou Bamba LO', { bold: true, color: '4A2C1D', size: 19 })]),
  fp(F_ENCADR, [cr('Encadreur pédagogique', { italics: true, color: '8A6A50', size: 16 })]),
  fp(F_ANNEE, [cr('ANNÉE ACADÉMIQUE 2025 – 2026', { bold: true, color: 'FFFFFF', sp: 40, size: 26 })], { align: AlignmentType.RIGHT, after: 60 }),
  fp(F_ANNEE, [cr('Diamniadio • Sénégal', { color: 'E2BA8C', sp: 30, size: 17 })], { align: AlignmentType.RIGHT }),
  new Paragraph({ children: [] }),
];
