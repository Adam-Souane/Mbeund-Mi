"""Affiche les occurrences Ruff pour les codes demandés (fichier relatif, ligne, message)."""
import json
import sys

d = json.load(open(sys.argv[1], encoding="utf-8"))
codes = sys.argv[2:]


def rel(p):
    p = p.replace(chr(92), "/")
    return p.split("/Mbeund-Mi/", 1)[1] if "/Mbeund-Mi/" in p else p


for code in codes:
    lignes = [m for m in d if m["code"] == code]
    print(f"== {code} ({len(lignes)})")
    for m in lignes:
        print(f"  {rel(m['filename'])}:{m['location']['row']}  {m['message'][:110]}")
