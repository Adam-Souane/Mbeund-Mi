# Dossier du rapport PFF

- `Rapport_PFF_MBEUND_MI_v4.docx` : le rapport (version de travail, avec 18 commentaires Word expliquant les corrections). `Rapport_PFF_MBEUND_MI_v4.pdf` : la même version pour l'impression.
- `sources/` : outils de génération. Le rapport est reconstruit par `v4_build.js` à partir du contenu importé (`import/rapport.json`), des corrections (`v4_corps.js`) et du modèle de page de garde ISEP-AT n° 2. Les chiffres de l'IA, des tests et des scénarios sont lus dans le dépôt (`metriques_rf.json`, `import/scenarios.json`).
- Corrections faites et points à vérifier : voir `docs/rapport/CORRECTIONS_RAPPORT.md`.

**Attention** : régénérer le rapport écrase les modifications faites directement dans le fichier Word. Choisir un seul mode de travail : modifier le Word (et ne plus régénérer), ou modifier les sources.
