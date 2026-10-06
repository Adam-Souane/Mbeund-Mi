"""Liste les fichiers de src/ jamais atteints depuis src/main.jsx en suivant les imports relatifs."""
import os
import re

SRC = r"C:\Users\pc\Documents\PERSO\Mbeund-Mi\src"
EXTS = ["", ".js", ".jsx", "/index.js", "/index.jsx"]
IMPORT = re.compile(r"""(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)|import\s+['"](\.[^'"]+)['"]""")


def resolve(base, spec):
    cible = os.path.normpath(os.path.join(os.path.dirname(base), spec))
    for ext in EXTS:
        p = cible + ext
        if os.path.isfile(p):
            return p
    return None


tous = set()
for racine, _, fichiers in os.walk(SRC):
    for f in fichiers:
        if f.endswith((".js", ".jsx")):
            tous.add(os.path.join(racine, f))

vus, pile = set(), [os.path.join(SRC, "main.jsx")]
while pile:
    f = pile.pop()
    if f in vus:
        continue
    vus.add(f)
    texte = open(f, encoding="utf-8").read()
    for m in IMPORT.finditer(texte):
        spec = next(g for g in m.groups() if g)
        cible = resolve(f, spec)
        if cible and cible.endswith((".js", ".jsx")):
            pile.append(cible)

morts = sorted(tous - vus)
total = 0
for f in morts:
    n = sum(1 for line in open(f, encoding="utf-8") if line.strip())
    total += n
    print(f"{n:5d}  {os.path.relpath(f, SRC).replace(os.sep, '/')}")
print(f"{len(morts)} fichiers non atteints sur {len(tous)}, {total} lignes")
