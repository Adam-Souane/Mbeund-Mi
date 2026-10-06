"""Affiche, pour une liste de règles ESLint, chaque occurrence avec fichier et ligne."""
import json
import sys

d = json.load(open("eslint.json", encoding="utf-8"))


def rel(p):
    p = p.replace(chr(92), "/")
    return p.split("/qa/", 1)[1] if "/qa/" in p else p


regles = sys.argv[1:]
for regle in regles:
    print("==", regle)
    for f in d:
        for m in f["messages"]:
            if m.get("ruleId") == regle:
                print(f"  {rel(f['filePath'])}:{m['line']}  {m['message'][:120]}")
