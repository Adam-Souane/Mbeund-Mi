// Rendu docx-js des blocs importés (voir importer_docx.py) : paragraphes, tableaux, images.
const fs = require('fs');
const path = require('path');
const {
  Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle,
  VerticalAlign, VerticalMergeType, PageBreak, SequentialIdentifier,
} = require('docx');

const IMG = path.join(__dirname, 'import', 'img');
const COLOR_MAP = { DCE8EC: 'EADBC8', '8A9BA5': 'C89B6D', '1B4F72': '4A2C1D', '102C57': '4A2C1D', '0F5D73': '8A6A50', '4A2F1F': '4A2C1D' };
const mapColor = (c) => (c ? (COLOR_MAP[c.toUpperCase()] || c) : undefined);
const JC = { both: AlignmentType.JUSTIFIED, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, left: AlignmentType.LEFT };

// renvois aux anciens chapitres → nouveau plan (chapitres numérotés en chiffres arabes)
const RENVOIS = [[/\b([Cc])hapitre IV\b/g, '$1hapitre 4'], [/\b([Cc])hapitre III\b/g, '$1hapitre 3'], [/\b([Cc])hapitre II\b/g, '$1hapitre 2'], [/\b([Cc])hapitre I\b/g, '$1hapitre 1']];
const fixRenvois = (t) => RENVOIS.reduce((s, [re, to]) => s.replace(re, to), t);
// renvois aux figures et tableaux : numéros recalculés après redistribution des sections
let refFix = (t) => t;
// corrections de faits vérifiées sur des sources (voir docs/rapport/CORRECTIONS_RAPPORT.md)
const FAITS = [
  ['P122756', 'P122841'],
  ['PROGEP, 2012-2020', 'PROGEP, 2012-2019'],
  ['(2012-2020)', '(2012-2019)'],
  ['FANFAR (2018-2022)', 'FANFAR (2018-2021)'],
];
const fixFaits = (t) => FAITS.reduce((acc, [a, b]) => acc.split(a).join(b), t);
const setRefFix = (f) => { refFix = f; };

const text = (b) => b.runs.map((r) => r.x || '').join('');

// markup interne : **gras**, *italique*, [[à vérifier]] surligné
function markup(t, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\])/g;
  let last = 0, m;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
    const s = m[0];
    if (s.startsWith('**')) out.push(new TextRun({ text: s.slice(2, -2), bold: true, ...base }));
    else if (s.startsWith('[[')) out.push(new TextRun({ text: '[' + s.slice(2, -2) + ']', highlight: 'yellow', italics: true, ...base }));
    else out.push(new TextRun({ text: s.slice(1, -1), italics: true, ...base }));
    last = m.index + s.length;
  }
  if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
  return out;
}

function toRun(r, opt = {}) {
  if (r.img) {
    return new ImageRun({ type: 'png', data: fs.readFileSync(path.join(IMG, r.img)), transformation: { width: Math.round(r.cx / 9525), height: Math.round(r.cy / 9525) } });
  }
  if (r.br) return r.br === 'page' ? new TextRun({ children: [new PageBreak()] }) : new TextRun({ break: 1 });
  const o = { text: fixFaits(refFix(fixRenvois((r.x || '').replace(/\t/g, '    ')))) };
  if (r.b) o.bold = true;
  if (r.i) o.italics = true;
  if (r.u) o.underline = {};
  if (r.hl) o.highlight = r.hl;
  if (r.color) o.color = mapColor(r.color);
  if (r.sz && !opt.noSize) o.size = r.sz;
  if (r.font && r.font !== 'Times New Roman') o.font = r.font;
  if (r.va === 'superscript') o.superScript = true;
  if (r.va === 'subscript') o.subScript = true;
  return new TextRun(o);
}

// Paragraphe importé. opt.cell : paragraphe de tableau ; opt.list : instance de numérotation
// Éclate les marqueurs [[...]] des runs importés en runs surlignés
function expandMarkers(runs) {
  const out = [];
  for (const r of runs) {
    if (!r.x || !r.x.includes('[[')) { out.push(r); continue; }
    const re = /\[\[[^\]]+\]\]/g;
    let last = 0, m;
    while ((m = re.exec(r.x))) {
      if (m.index > last) out.push({ ...r, x: r.x.slice(last, m.index) });
      out.push({ ...r, x: '[' + m[0].slice(2, -2) + ']', hl: 'yellow', i: 1 });
      last = m.index + m[0].length;
    }
    if (last < r.x.length) out.push({ ...r, x: r.x.slice(last) });
  }
  return out;
}

function renderP(b, opt = {}) {
  const hasImg = b.runs.some((r) => r.img);
  const children = expandMarkers(b.runs).map((r) => toRun(r, { noSize: !opt.cell }));
  const o = { children };
  if (opt.cell) {
    o.alignment = JC[b.jc] || AlignmentType.LEFT;
    if (b.sp) o.spacing = { before: b.sp.before, after: b.sp.after, line: b.sp.line };
  } else if (hasImg) {
    o.alignment = AlignmentType.CENTER; o.keepNext = true; o.spacing = { before: 120, after: 60 };
  } else {
    o.alignment = opt.align || JC[b.jc] || AlignmentType.JUSTIFIED;
    if (opt.spacing) o.spacing = opt.spacing;
  }
  if (b.ind && opt.cell) o.indent = { left: b.ind.left, hanging: b.ind.hanging, firstLine: b.ind.firstLine };
  if (opt.hang) o.indent = { left: 567, hanging: 567 };
  if (opt.keepNext || b.keepNext) o.keepNext = true;
  if (b.num && !opt.noList) {
    o.numbering = { reference: b.num.fmt === 'bullet' ? 'puces' : 'num', level: 0, ...(b.num.fmt === 'bullet' ? {} : { instance: opt.list || 1 }) };
  }
  return new Paragraph(o);
}

const BORDER_STYLE = { single: BorderStyle.SINGLE, double: BorderStyle.DOUBLE, nil: BorderStyle.NONE, none: BorderStyle.NONE, dotted: BorderStyle.DOTTED, dashed: BorderStyle.DASHED };
function renderTable(b, contentW = 9070) {
  let widths = b.grid.length ? b.grid.slice() : [];
  const sum = widths.reduce((a, c) => a + c, 0);
  if (sum && sum !== contentW) widths = widths.map((w) => Math.round((w * contentW) / sum));
  const rows = b.rows.map((row) => {
    let col = 0;
    const cells = row.cells.map((c) => {
      const span = c.span || 1;
      const w = widths.slice(col, col + span).reduce((a, x) => a + x, 0) || c.w || 1500;
      col += span;
      const o = { width: { size: w, type: WidthType.DXA }, children: (c.ps.length ? c.ps : [{ t: 'p', st: '', runs: [] }]).map((p) => renderP(p, { cell: true })) };
      if (span > 1) o.columnSpan = span;
      if (c.vm) o.verticalMerge = c.vm === 'restart' ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE;
      if (c.fill) o.shading = { fill: mapColor(c.fill), type: ShadingType.CLEAR, color: 'auto' };
      if (c.bd) {
        o.borders = {};
        for (const [side, e] of Object.entries(c.bd)) o.borders[side] = { style: BORDER_STYLE[e.v] || BorderStyle.SINGLE, size: e.sz, color: mapColor(e.c) || 'C89B6D' };
      }
      if (c.mar) o.margins = { top: c.mar.top, bottom: c.mar.bottom, left: c.mar.left, right: c.mar.right };
      if (c.va === 'center') o.verticalAlign = VerticalAlign.CENTER;
      return new TableCell(o);
    });
    return new TableRow({ tableHeader: row.hdr || undefined, cantSplit: true, children: cells });
  });
  return new Table({ width: { size: contentW, type: WidthType.DXA }, columnWidths: widths, alignment: b.jc === 'center' ? AlignmentType.CENTER : undefined, rows });
}

// Remplace du texte dans un paragraphe importé (dans le run qui le contient ; sinon fusion des runs).
function patch(block, pairs) {
  const b = JSON.parse(JSON.stringify(block));
  for (const [find, repl] of pairs) {
    let done = false;
    for (const r of b.runs) {
      if (r.x && r.x.includes(find)) { r.x = r.x.replace(find, repl); done = true; break; }
    }
    if (!done) {
      const full = text(b);
      if (!full.includes(find)) throw new Error('Texte introuvable pour correction : ' + find.slice(0, 70));
      const first = b.runs.find((r) => r.x) || {};
      b.runs = [{ ...first, x: full.replace(find, repl) }];
    }
  }
  return b;
}

// Découpe « lead <br> corps <br> corps » en [lead, corps…]
function splitLead(block) {
  const segs = [[]];
  for (const r of block.runs) {
    if (r.br === 'line') segs.push([]); else segs[segs.length - 1].push(r);
  }
  return segs.filter((s) => s.length).map((s) => ({ ...block, runs: s.map((r) => ({ ...r })) }));
}

// Légende : « Figure 9 : texte » → [Paragraph]
function renderCaption(b, captionFn) {
  const t = text(b).trim();
  const m = t.match(/^(Figure|Tableau)\s+\d+\s*:\s*(.*)$/s);
  if (!m) return renderP(b, { align: AlignmentType.CENTER });
  return captionFn(m[1], m[2]);
}

module.exports = { setRefFix, mapColor, text, markup, toRun, renderP, renderTable, patch, splitLead, renderCaption, JC, fixRenvois };
