
// ======================= CORPS (plan officiel ISEP-AT) =======================
const intro = require('./intro_v3.js')({ H1np: tH1np, H2: tH2, H4, P, B, N, tableBlock });
const chap1 = require('./chap1.js')({ H1: tH1, H2: tH2, H3: tH3, H4, P, B, figure, tableBlock });
const chap2 = require('./chap2.js')({ H1: tH1, H2: tH2, H3: tH3, H4, P, B, figure, tableBlock });
const chap3 = require('./chap3.js')({ H1: tH1, H2: tH2, H3: tH3, H4, P, B, figure, tableBlock });
const { corpsIntro, ch1, ch2, ch3, ch4, conclusion } = require('./v3_corps.js')({ H1, H2, H3, H4, P, B, figure, tableBlock, tag, intro, chap1, chap2, chap3 });

// ======================= PAGES DE FIN =======================
const fin = [
  /*FIN*/
];
const tdmDetaillee = [Unnumbered('TABLE DES MATIÈRES DÉTAILLÉE'), new TableOfContents('Table des matières détaillée', { hyperlink: true, headingStyleRange: '1-4' })];
