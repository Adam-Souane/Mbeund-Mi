from django.core.management.base import BaseCommand
from django.contrib.gis.geos import GEOSGeometry
from django.conf import settings

from alertes.models import SegmentRue, ZoneRisque

# Préfixe utilisé pour identifier (et pouvoir ré-exécuter sans dupliquer) les
# segments de démonstration créés par cette commande.
PREFIX = 'Demo -'

# Deux itinéraires concurrents entre le même point de départ (Thiaroye Gare)
# et le même point d'arrivée (à la frontière de Route de Rufisque) : un
# chemin direct mais à haut risque, et un détour plus long mais sûr — de
# quoi démontrer visiblement que l'itinéraire calculé évite le premier au
# profit du second (voir api/services/routing_service.py).
START = (-17.3855, 14.7455)  # Thiaroye Gare
JOIN = (-17.3690, 14.7600)   # convergence avant Route de Rufisque
END = (-17.3670, 14.7620)    # à l'intérieur de Route de Rufisque

RISKY_PATH = [START, (-17.3810, 14.7490), (-17.3770, 14.7520), (-17.3730, 14.7560), JOIN]
SAFE_PATH = [START, (-17.3890, 14.7500), (-17.3860, 14.7550), (-17.3800, 14.7600), (-17.3740, 14.7630), JOIN]


class Command(BaseCommand):
    help = (
        "Seed un petit réseau de rues connecté (SegmentRue) démontrant "
        "l'itinéraire d'évacuation sûr : un chemin direct à haut risque et "
        "un détour plus sûr entre Thiaroye Gare et Route de Rufisque."
    )

    def handle(self, *args, **options):
        if not settings.USE_GIS:
            self.stderr.write(self.style.ERROR(
                "USE_GIS=False : cette commande nécessite PostGIS (geom attend des objets GEOS)."
            ))
            return

        deleted, _ = SegmentRue.objects.filter(nom__startswith=PREFIX).delete()
        if deleted:
            self.stdout.write(f"{deleted} segment(s) de démonstration précédent(s) supprimé(s).")

        try:
            zone_thiaroye = ZoneRisque.objects.get(quartier='Thiaroye Gare')
            zone_guinaw = ZoneRisque.objects.get(quartier='Guinaw Rail')
            zone_rufisque = ZoneRisque.objects.get(quartier='Route de Rufisque')
        except ZoneRisque.DoesNotExist as exc:
            self.stderr.write(self.style.ERROR(
                f"Zone attendue introuvable ({exc}) — ce seed suppose les 3 zones de démo habituelles."
            ))
            return

        created = 0

        def make_segment(nom, coords, zone, etat_drainage, score_risque_actuel):
            nonlocal created
            wkt = 'LINESTRING(' + ', '.join(f'{lon} {lat}' for lon, lat in coords) + ')'
            SegmentRue.objects.create(
                nom=f'{PREFIX} {nom}',
                geom=GEOSGeometry(f'SRID=4326;{wkt}'),
                zone=zone,
                etat_drainage=etat_drainage,
                score_risque_actuel=score_risque_actuel,
            )
            created += 1

        # Chemin direct — drainage obstrué, risque élevé sur chaque tronçon.
        for i in range(len(RISKY_PATH) - 1):
            zone = zone_thiaroye if i < 2 else zone_guinaw
            make_segment(f'Rue directe {i + 1}', RISKY_PATH[i:i + 2], zone, 'obstrue', 0.85)

        # Détour — drainage correct, risque faible.
        for i in range(len(SAFE_PATH) - 1):
            zone = zone_thiaroye if i < 2 else zone_guinaw
            make_segment(f'Rue détour {i + 1}', SAFE_PATH[i:i + 2], zone, 'bon', 0.1)

        # Dernier tronçon commun, jusqu'à l'intérieur de la zone sûre.
        make_segment('Entrée zone sûre', [JOIN, END], zone_rufisque, 'bon', 0.05)

        self.stdout.write(self.style.SUCCESS(f"{created} segment(s) de démonstration créé(s)."))
