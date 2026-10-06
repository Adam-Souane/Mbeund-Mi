"""
Commande Django pour créer les capteurs IoT initiaux à Thiaroye.
Permet d'alimenter la carte SIG et la page d'administration des capteurs.
"""
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.utils import timezone
from datetime import date
from capteurs.models import Capteur
from alertes.models import ZoneRisque


class Command(BaseCommand):
    help = "Initialise les capteurs IoT pour les zones de Thiaroye"

    def handle(self, *args, **options):
        zone_thiaroye = ZoneRisque.objects.filter(quartier__icontains="Thiaroye").first()
        zone_guinaw = ZoneRisque.objects.filter(quartier__icontains="Guinaw").first()
        zone_rufisque = ZoneRisque.objects.filter(quartier__icontains="Rufisque").first()

        capteurs_data = [
            {
                "nom": "Capteur Eau - Thiaroye Gare",
                "code": "CAP-EAU-01",
                "type": "eau",
                "lng": -17.374694,
                "lat": 14.742333,
                "zone": zone_thiaroye,
            },
            {
                "nom": "Capteur Eau - Wakhinane",
                "code": "CAP-EAU-02",
                "type": "eau",
                "lng": -17.377000,
                "lat": 14.741333,
                "zone": zone_guinaw,
            },
            {
                "nom": "Capteur Eau - Diamaguene",
                "code": "CAP-EAU-03",
                "type": "eau",
                "lng": -17.376472,
                "lat": 14.743167,
                "zone": zone_thiaroye,
            },
            {
                "nom": "Capteur Eau - Thiaroye Mer",
                "code": "CAP-EAU-04",
                "type": "eau",
                "lng": -17.375500,
                "lat": 14.740500,
                "zone": zone_rufisque,
            },
            {
                "nom": "Capteur Eau - Zone Industrielle",
                "code": "CAP-EAU-05",
                "type": "eau",
                "lng": -17.373000,
                "lat": 14.744000,
                "zone": zone_guinaw,
            },
            {
                "nom": "Pluviometre Mairie",
                "code": "PLUVIO-01",
                "type": "pluviometre",
                "lng": -17.375000,
                "lat": 14.742000,
                "zone": zone_thiaroye,
            },
            {
                "nom": "Pluviometre Pikine Est",
                "code": "PLUVIO-02",
                "type": "pluviometre",
                "lng": -17.372000,
                "lat": 14.743500,
                "zone": zone_rufisque,
            },
            {
                "nom": "Pluviometre Pikine Ouest",
                "code": "PLUVIO-03",
                "type": "pluviometre",
                "lng": -17.378000,
                "lat": 14.741000,
                "zone": zone_guinaw,
            },
        ]

        created = 0
        for item in capteurs_data:
            capteur, was_created = Capteur.objects.get_or_create(
                code_identifiant=item["code"],
                defaults={
                    "nom": item["nom"],
                    "type": item["type"],
                    "localisation": Point(item["lng"], item["lat"]),
                    "zone": item["zone"],
                    "statut": "actif",
                    "date_installation": date(2025, 1, 15),
                    "dernier_releve": timezone.now(),
                }
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"[OK] {created} capteurs crees ({Capteur.objects.count()} au total)"))
