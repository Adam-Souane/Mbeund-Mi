import json, re, collections
d=json.load(open('cc.json',encoding='utf-8'))
per=collections.Counter(); fns=[]
for f in d:
    p=f['filePath'].replace(chr(92),'/').split('/qa/')[1]
    lines=sum(1 for _ in open(f['filePath'],encoding='utf-8'))
    for m in f['messages']:
        mm=re.search(r'from (\d+) to',m['message'])
        if mm: v=int(mm.group(1)); per[p]+=v; fns.append((v,p,m['line']))
    per.setdefault(p,0)
tot=sum(per.values()); print('complexité cognitive totale frontend', tot)
print('-- fichiers'); 
for p,v in per.most_common(10):
    n=sum(1 for _ in open(p,encoding='utf-8')); print(f'{v:5d}  {n:5d} lignes  {p}')
print('-- fonctions'); 
for v,p,l in sorted(fns,reverse=True)[:10]: print(f'{v:4d}  {p}:{l}')
