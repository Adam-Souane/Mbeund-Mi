# Assemble gen_v3.js à partir de gen.js (v2) : page de garde du modèle ISEP-AT,
# liminaires dans l'ordre du plan officiel, corps en 4 chapitres (voir v3_corps.js).
import re
s = open('gen.js', encoding='utf8').read()
I = lambda m: s.index(m)
head = s[:I('// ======================= PAGE DE GARDE')]
limin = s[I('// ======================= LIMINAIRES'):I('// ======================= INTRODUCTION')]
fin = s[I("H1('WEBOGRAPHIE')"):I('// ======================= DOCUMENT')].rstrip()
assert fin.endswith('];')
fin = fin[:-2]

# --- en-tête : imports, couleurs de la charte ISEP-AT, pied de page
head = head.replace("} = require('docx');", "  LineRuleType, FrameAnchorType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,\n} = require('docx');", 1)
head = head.replace("color: '8A9BA5' };", "color: 'C89B6D' };")
head = head.replace("fill: 'DCE8EC'", "fill: 'EADBC8'")
footer_new = ("const CG = 'Century Gothic';\n"
              "const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: ["
              "new TextRun({ text: 'ISEP-AT • PFF 2025-2026 ', font: CG, size: 15, color: '8A6A50' }), "
              "new TextRun({ children: [PageNumber.CURRENT], font: CG, size: 15, bold: true, color: 'C89B6D' })] })] });\n")
head = re.sub(r"const footer = new Footer\(.*?\n", lambda m: footer_new, head, flags=re.S)
head += """
// étiquetage des titres des anciens chapitres, pour les redistribuer par titre
const tag = (lvl, f) => (t) => { const p = f(t); p._h = { lvl, t }; return p; };
const tH1 = tag(1, H1), tH1np = tag(1, H1np), tH2 = tag(2, H2), tH3 = tag(3, H3);
"""

# --- liminaires : retrait de l'avant-propos, 6 mots-clés, ordre du plan officiel
a = limin.index('const avantPropos'); b = limin.index('const resume')
limin = limin[:a] + limin[b:]
k1 = "**Mots-clés :** inondations urbaines et côtières, Thiaroye-sur-Mer, système d\\'alerte précoce, SIG, PostGIS, apprentissage automatique, participation citoyenne, Django REST Framework, React."
k2 = "**Keywords:** urban and coastal flooding, Thiaroye-sur-Mer, early warning system, GIS, PostGIS, machine learning, citizen participation, Django REST Framework, React."
assert k1 in limin and k2 in limin
limin = limin.replace(k1, "**Mots-clés :** inondations, Thiaroye-sur-Mer, alerte précoce, SIG, apprentissage automatique, participation citoyenne.")
limin = limin.replace(k2, "**Keywords:** flooding, Thiaroye-sur-Mer, early warning, GIS, machine learning, citizen participation.")
c = limin.index('const listes')
limin = limin[:c] + """const sommaire = [Unnumbered('SOMMAIRE'), new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-2' })];
const listesFT = [
  Unnumbered('LISTE DES FIGURES'),
  new TableOfContents('Liste des figures', { hyperlink: true, captionLabelIncludingNumbers: 'Figure' }),
  Unnumbered('LISTE DES TABLEAUX'),
  new TableOfContents('Liste des tableaux', { hyperlink: true, captionLabelIncludingNumbers: 'Tableau' }),
];
"""

cover = open('v3_cover.js', encoding='utf8').read()
body = open('v3_assemblage.js', encoding='utf8').read()
body = body.replace('/*FIN*/', fin.replace("H1('WEBOGRAPHIE')", "H1('BIBLIOGRAPHIE ET WEBOGRAPHIE')", 1))
body = body.replace("Références citées de l'introduction au chapitre II. La liste sera complétée à l'étape 4. Les dates de consultation surlignées sont à renseigner.",
                    "Références au format APA (7e édition). Chacun ajoute les sources citées dans ses sections du chapitre 4 ; les dates de consultation surlignées sont à renseigner.")
body = body.replace("ÉTAPE 4 : guide d\\'entretien", "À COMPLÉTER : guide d\\'entretien")

doc = s[I('// ======================= DOCUMENT'):]
doc = doc.replace("const doc = new Document({", "const MARGIN0 = { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 };\nconst doc = new Document({")
doc = doc.replace("color: '4A2F1F'", "color: '4A2C1D'").replace("color: '0F5D73'", "color: '8A6A50'")
a = doc.index('  sections: ['); b = doc.index('Packer.toBuffer')
doc = doc[:a] + open('v3_sections.js', encoding='utf8').read() + doc[b:]
doc = doc.replace("title: 'MBEUND MI : rapport de Projet de Fin de Formation'", "title: 'MBEUND MI : rapport de Projet de Fin de Formation (PFF 2025-2026)'")
open('gen_v3.js', 'w', encoding='utf8').write(head + limin + cover + body + doc)
print('gen_v3.js écrit')
