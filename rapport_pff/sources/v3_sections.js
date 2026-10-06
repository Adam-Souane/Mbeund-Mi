  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: MARGIN0 } }, children: pageDeGarde },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 }, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } }, footers: { default: footer },
      children: [...dedicaces, ...remerciements, ...resume, ...sommaire, ...listeSigles, ...listesFT] },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } }, footers: { default: footer },
      children: [...corpsIntro, ...ch1, ...ch2, ...ch3, ...ch4, ...conclusion, ...fin, ...tdmDetaillee] },
  ],
});

