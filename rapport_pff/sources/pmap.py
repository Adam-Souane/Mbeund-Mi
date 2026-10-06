import pymupdf, sys
d=pymupdf.open('rendu.pdf'); print('pages pdf',len(d))
marks=['INTRODUCTION GÉNÉRALE','CHAPITRE I : CADRE','CHAPITRE II : CONTEXTE','CHAPITRE III','CHAPITRE IV','CONCLUSION GÉNÉRALE','WEBOGRAPHIE','ANNEXES']
seen=set()
for i,p in enumerate(d):
    lines=[l.strip() for l in p.get_text().split('\n')]
    for m in marks:
        if m not in seen and i>9 and any(l.startswith(m) for l in lines[:4]): seen.add(m); print(f'{m:28s} page {lines[0]} (pdf {i+1})')
