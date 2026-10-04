import sys
from markdown_pdf import MarkdownPdf
from markdown_pdf import Section

# Lire le fichier Markdown
with open('Dossier_Final_Mbeund_Mi.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# Configurer et générer le PDF
pdf = MarkdownPdf(toc_level=2)
pdf.add_section(Section(md_content))
pdf.meta["title"] = "Dossier Final - Projet Mbeund-Mi"
pdf.meta["author"] = "Equipe PFF2"
pdf.save('Dossier_Final_Mbeund_Mi.pdf')

print("✅ Fichier PDF généré avec succès !")
