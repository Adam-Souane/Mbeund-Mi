"""Compte les lignes de code utiles (hors lignes vides et commentaires) par périmètre."""
import json
import os
import re

ROOT = r"C:\Users\pc\Documents\PERSO\Mbeund-Mi"
EXCLUS = {"node_modules", "env", "dist", "__pycache__", ".git", ".pytest_cache", "rapport_pff"}


def loc(path, kind):
    n, bloc = 0, False
    for line in open(path, encoding="utf-8", errors="ignore"):
        s = line.strip()
        if not s:
            continue
        if kind == "py":
            if s.startswith("#"):
                continue
        else:
            if bloc:
                if "*/" in s:
                    bloc = False
                continue
            if s.startswith("//"):
                continue
            if s.startswith("/*"):
                if "*/" not in s:
                    bloc = True
                continue
        n += 1
    return n


groupes = {}


def ajouter(g, chemin, kind):
    d = groupes.setdefault(g, {"fichiers": 0, "lignes": 0})
    d["fichiers"] += 1
    d["lignes"] += loc(chemin, kind)


for racine, dossiers, fichiers in os.walk(ROOT):
    dossiers[:] = [d for d in dossiers if d not in EXCLUS]
    for nom in fichiers:
        chemin = os.path.join(racine, nom)
        rel = os.path.relpath(chemin, ROOT).replace(os.sep, "/")
        if nom.endswith(".py"):
            if "/migrations/" in rel:
                g = "python migrations"
            elif rel.startswith("backend/"):
                g = "backend tests" if re.search(r"(^|/)(test[^/]*|tests|conftest)\.py$", rel) else "backend Django"
            elif rel.startswith("mbeund_mi_ia/"):
                g = "mbeund_mi_ia tests" if "/tests/" in rel else "mbeund_mi_ia (IA)"
            else:
                g = "python autres"
            ajouter(g, chemin, "py")
        elif rel.startswith("src/") and nom.endswith((".js", ".jsx")):
            ajouter("frontend React (JS/JSX)", chemin, "js")
        elif rel.startswith("src/") and nom.endswith(".css"):
            ajouter("frontend CSS", chemin, "js")

print(json.dumps(groupes, indent=1, ensure_ascii=False))
