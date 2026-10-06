# Importe un rapport Word (.docx) en blocs JSON : paragraphes, tableaux, images.
# Usage : python importer_docx.py rapport.docx sortie.json dossier_images
# Les tables des matières et listes de figures/tableaux sont ignorées (régénérées au build).
import json, os, re, sys, zipfile
import xml.etree.ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
WP = '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
SKIP_STYLES = {'TM1', 'TM2', 'TM3', 'TM4', 'Tabledesillustrations', 'TOC1', 'TOC2', 'TOC3', 'TOC4', 'TOCHeading'}

src, out_json, out_img = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out_img, exist_ok=True)
z = zipfile.ZipFile(src)
doc = ET.fromstring(z.read('word/document.xml'))
rels = {}
for r in ET.fromstring(z.read('word/_rels/document.xml.rels')):
    rels[r.get('Id')] = r.get('Target')
numfmt = {}
if 'word/numbering.xml' in z.namelist():
    num = ET.fromstring(z.read('word/numbering.xml'))
    abstract = {}
    for an in num.findall(W + 'abstractNum'):
        lv = an.find(W + 'lvl')
        fmt = lv.find(W + 'numFmt').get(W + 'val') if lv is not None and lv.find(W + 'numFmt') is not None else 'bullet'
        abstract[an.get(W + 'abstractNumId')] = fmt
    for n in num.findall(W + 'num'):
        numfmt[n.get(W + 'numId')] = abstract.get(n.find(W + 'abstractNumId').get(W + 'val'), 'bullet')


def val(el, tag, attr='val'):
    c = el.find(W + tag) if el is not None else None
    return c.get(W + attr) if c is not None else None


def on(rpr, tag):
    c = rpr.find(W + tag) if rpr is not None else None
    if c is None:
        return False
    return c.get(W + 'val') not in ('0', 'false', 'none')


def parse_run(r, state):
    """Retourne une liste de morceaux de run ; state suit les champs (begin/separate/end)."""
    out = []
    rpr = r.find(W + 'rPr')
    base = {}
    if rpr is not None:
        if on(rpr, 'b'): base['b'] = 1
        if on(rpr, 'i'): base['i'] = 1
        if rpr.find(W + 'u') is not None and val(rpr, 'u') != 'none': base['u'] = 1
        hl = val(rpr, 'highlight')
        if hl: base['hl'] = hl
        col = val(rpr, 'color')
        if col and col != 'auto': base['color'] = col
        sz = val(rpr, 'sz')
        if sz: base['sz'] = int(sz)
        rf = rpr.find(W + 'rFonts')
        if rf is not None and rf.get(W + 'ascii'): base['font'] = rf.get(W + 'ascii')
        va = val(rpr, 'vertAlign')
        if va: base['va'] = va
    for ch in r:
        tag = ch.tag
        if tag == W + 'fldChar':
            t = ch.get(W + 'fldCharType')
            if t == 'begin': state['in'] = True; state['instr'] = ''; state['res'] = False
            elif t == 'separate': state['res'] = True
            elif t == 'end':
                state['in'] = False; state['res'] = False
            continue
        if tag == W + 'instrText':
            state['instr'] = state.get('instr', '') + (ch.text or '')
            m = re.search(r'SEQ\s+(\w+)', state['instr'])
            if m: state['seq'] = m.group(1)
            continue
        if state.get('in') and not state.get('res'):
            continue
        if tag == W + 't':
            if ch.text: out.append(dict(base, x=ch.text))
        elif tag == W + 'tab':
            out.append(dict(base, x='\t'))
        elif tag == W + 'br':
            out.append({'br': 'page' if ch.get(W + 'type') == 'page' else 'line'})
        elif tag == W + 'drawing':
            blip = ch.find('.//' + A + 'blip')
            ext = ch.find('.//' + WP + 'extent')
            if blip is not None and ext is not None:
                target = rels.get(blip.get(R + 'embed'), '')
                name = os.path.basename(target)
                data = z.read('word/' + target)
                with open(os.path.join(out_img, name), 'wb') as f:
                    f.write(data)
                out.append({'img': name, 'cx': int(ext.get('cx')), 'cy': int(ext.get('cy'))})
    return out


def parse_p(p):
    ppr = p.find(W + 'pPr')
    st = val(ppr, 'pStyle') or ''
    blk = {'t': 'p', 'st': st, 'runs': []}
    if ppr is not None:
        jc = val(ppr, 'jc')
        if jc: blk['jc'] = jc
        sp = ppr.find(W + 'spacing')
        if sp is not None:
            blk['sp'] = {k: int(sp.get(W + k)) for k in ('before', 'after', 'line') if sp.get(W + k) is not None}
        ind = ppr.find(W + 'ind')
        if ind is not None:
            blk['ind'] = {k: int(ind.get(W + k)) for k in ('left', 'hanging', 'firstLine') if ind.get(W + k) is not None}
        if ppr.find(W + 'keepNext') is not None: blk['keepNext'] = 1
        if ppr.find(W + 'pageBreakBefore') is not None: blk['pbb'] = 1
        np_ = ppr.find(W + 'numPr')
        if np_ is not None:
            nid = val(np_, 'numId')
            blk['num'] = {'id': nid, 'fmt': numfmt.get(nid, 'bullet'), 'lvl': int(val(np_, 'ilvl') or 0)}
        shd = ppr.find(W + 'shd')
        if shd is not None and shd.get(W + 'fill') not in (None, 'auto'): blk['fill'] = shd.get(W + 'fill')
    state = {}
    def walk(node):
        for ch in node:
            if ch.tag == W + 'r':
                blk['runs'].extend(parse_run(ch, state))
            elif ch.tag in (W + 'hyperlink', W + 'smartTag'):
                walk(ch)
    walk(p)
    if state.get('seq'): blk['seq'] = state['seq']
    # fusion des morceaux adjacents de même mise en forme
    merged = []
    for r in blk['runs']:
        if merged and 'x' in r and 'x' in merged[-1] and {k: v for k, v in r.items() if k != 'x'} == {k: v for k, v in merged[-1].items() if k != 'x'}:
            merged[-1]['x'] += r['x']
        else:
            merged.append(dict(r))
    blk['runs'] = merged
    return blk


def parse_tbl(tbl):
    out = {'t': 'tbl', 'rows': []}
    tp = tbl.find(W + 'tblPr')
    out['jc'] = val(tp, 'jc')
    grid = tbl.find(W + 'tblGrid')
    out['grid'] = [int(g.get(W + 'w')) for g in grid.findall(W + 'gridCol')] if grid is not None else []
    for tr in tbl.findall(W + 'tr'):
        trpr = tr.find(W + 'trPr')
        row = {'hdr': trpr is not None and trpr.find(W + 'tblHeader') is not None, 'cells': []}
        for tc in tr.findall(W + 'tc'):
            tcpr = tc.find(W + 'tcPr')
            cell = {'ps': []}
            if tcpr is not None:
                w = tcpr.find(W + 'tcW')
                if w is not None: cell['w'] = int(w.get(W + 'w'))
                shd = tcpr.find(W + 'shd')
                if shd is not None and shd.get(W + 'fill') not in (None, 'auto'): cell['fill'] = shd.get(W + 'fill')
                gs = val(tcpr, 'gridSpan')
                if gs: cell['span'] = int(gs)
                vm = tcpr.find(W + 'vMerge')
                if vm is not None: cell['vm'] = vm.get(W + 'val') or 'cont'
                va = val(tcpr, 'vAlign')
                if va: cell['va'] = va
                tb = tcpr.find(W + 'tcBorders')
                if tb is not None:
                    cell['bd'] = {}
                    for side in ('top', 'left', 'bottom', 'right'):
                        e = tb.find(W + side)
                        if e is not None:
                            cell['bd'][side] = {'v': e.get(W + 'val'), 'sz': int(e.get(W + 'sz') or 4), 'c': e.get(W + 'color')}
                mar = tcpr.find(W + 'tcMar')
                if mar is not None:
                    cell['mar'] = {s: int(mar.find(W + s).get(W + 'w')) for s in ('top', 'bottom', 'left', 'right') if mar.find(W + s) is not None}
            for p in tc.findall(W + 'p'):
                cell['ps'].append(parse_p(p))
            row['cells'].append(cell)
        out['rows'].append(row)
    return out


blocks = []
body = doc.find(W + 'body')
for ch in body:
    if ch.tag == W + 'p':
        b = parse_p(ch)
        if b['st'] in SKIP_STYLES:
            continue
        blocks.append(b)
    elif ch.tag == W + 'tbl':
        blocks.append(parse_tbl(ch))
json.dump(blocks, open(out_json, 'w', encoding='utf8'), ensure_ascii=False)
from collections import Counter
print(len(blocks), 'blocs', Counter(b['t'] for b in blocks), 'images', len(os.listdir(out_img)))
