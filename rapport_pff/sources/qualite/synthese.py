"""Classe les remontées ESLint + Ruff en bugs / vulnérabilités / code smells (typologie SonarQube)."""
import collections
import json

eslint = json.load(open("eslint.json", encoding="utf-8"))
ruff = json.load(open("ruff.json", encoding="utf-8"))

BUGS = {
    "react-hooks/rules-of-hooks", "react-hooks/exhaustive-deps", "react-hooks/set-state-in-effect",
    "react-hooks/immutability", "F821", "F811", "PLW1508",
}
VULNS = {"S301", "S311", "sonarjs/pseudo-random"}

compte = collections.Counter()
par_regle = collections.Counter()
par_fichier = collections.Counter()


def classer(regle):
    if regle in BUGS:
        return "bug"
    if regle in VULNS:
        return "vulnérabilité"
    return "smell"


for f in eslint:
    chemin = f["filePath"].replace(chr(92), "/").split("/qa/")[1]
    for m in f["messages"]:
        r = m.get("ruleId") or "parse"
        compte[("frontend", classer(r))] += 1
        par_regle[("frontend", r)] += 1
        par_fichier[chemin] += 1
for m in ruff:
    chemin = m["filename"].replace(chr(92), "/").split("/Mbeund-Mi/")[1]
    perim = "IA" if chemin.startswith("mbeund_mi_ia") else "backend"
    compte[(perim, classer(m["code"]))] += 1
    par_regle[(perim, m["code"])] += 1
    par_fichier[chemin] += 1

for perim in ("backend", "IA", "frontend"):
    print(perim, {k: compte[(perim, k)] for k in ("bug", "vulnérabilité", "smell")})
print("TOTAL", {k: sum(v for (p, kk), v in compte.items() if kk == k) for k in ("bug", "vulnérabilité", "smell")})
print("--- fichiers les plus signalés")
for f, n in par_fichier.most_common(12):
    print(f"{n:4d}  {f}")
