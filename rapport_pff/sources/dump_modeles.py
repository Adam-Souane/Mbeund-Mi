# Exporte la structure réelle des modèles Django (champs, types) pour l'annexe « dictionnaire de données ».
# Usage (depuis backend/, avec l'environnement du projet et GDAL) : python dump_modeles.py sortie.json
import json, os, sys
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings_audit')
import django
django.setup()
from django.apps import apps

TABLES = ['alertes_zonerisque', 'capteurs_capteur', 'capteurs_mesure', 'alertes_signalementcitoyen',
          'alertes_alerte', 'alertes_previsionmeteo', 'alertes_pointrefuge', 'alertes_segmentrue']
out = {}
for m in apps.get_models():
    t = m._meta.db_table
    if t not in TABLES:
        continue
    fields = []
    for f in m._meta.concrete_fields:
        typ = f.get_internal_type()
        if f.is_relation and f.related_model is not None:
            typ = f'ForeignKey({f.related_model.__name__})'
        elif typ in ('CharField',):
            typ = f'CharField({f.max_length})'
        fields.append({'name': f.column if f.is_relation else f.name, 'type': typ, 'null': bool(f.null), 'pk': bool(f.primary_key), 'verbose': str(f.verbose_name)})
    out[t] = {'modele': m.__name__, 'fields': fields}
json.dump(out, open(sys.argv[1], 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print({k: len(v['fields']) for k, v in out.items()})
