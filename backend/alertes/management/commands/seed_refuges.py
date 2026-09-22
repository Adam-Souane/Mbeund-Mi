"""
Django management command to seed refuge points (écoles, mosquées, centres) in Thiaroye.

Usage:
    python manage.py seed_refuges
    python manage.py seed_refuges --clear  # Delete existing refuges before seeding
"""
from django.core.management.base import BaseCommand
from alertes.models import PointRefuge, ZoneRisque


class Command(BaseCommand):
    help = 'Seed refuge points (schools, mosques, community centers) in Thiaroye'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all refuges before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = PointRefuge.objects.all().delete()[0]
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {count} refuges')
            )

        # Thiaroye zones (if they exist)
        zones = {zone.quartier: zone for zone in ZoneRisque.objects.all()}
        default_zone = ZoneRisque.objects.first()

        # Real refuge data for Thiaroye-sur-Mer (WGS84: SRID 4326)
        # Coordinates are approximate center points for known locations
        refuges_data = [
            {
                'nom': 'École Primaire de Thiaroye Centre',
                'type_refuge': 'ecole',
                'quartier': 'Thiaroye Centre',
                'adresse': 'Rue Principale, Thiaroye',
                'localisation': 'POINT(-17.3779 14.7597)',
                'capacite': 300,
                'contact': '+221 77 XXX XXXX',
                'hauteur_etage': 1,
                'notes': 'École surélevée, peut servir de refuge primaire',
            },
            {
                'nom': 'Lycée de Thiaroye',
                'type_refuge': 'ecole',
                'quartier': 'Thiaroye Gare',
                'adresse': 'Avenue de la Gare, Thiaroye',
                'localisation': 'POINT(-17.3789 14.7575)',
                'capacite': 500,
                'contact': '+221 77 XXX XXXX',
                'hauteur_etage': 2,
                'notes': 'Grande capacité, bâtiment moderne avec étages',
            },
            {
                'nom': 'Mosquée de Thiaroye',
                'type_refuge': 'mosquee',
                'quartier': 'Thiaroye Centre',
                'adresse': 'Quartier Centre, Thiaroye',
                'localisation': 'POINT(-17.3815 14.7585)',
                'capacite': 200,
                'contact': '+221 77 XXX XXXX',
                'notes': 'Centre de la communauté musulmane, bâtiment solide',
            },
            {
                'nom': 'Centre de Santé de Thiaroye',
                'type_refuge': 'centre_sante',
                'quartier': 'Thiaroye Centre',
                'adresse': 'Rue de la Santé, Thiaroye',
                'localisation': 'POINT(-17.3805 14.7605)',
                'capacite': 150,
                'contact': '+221 77 XXX XXXX',
                'hauteur_etage': 1,
                'notes': 'Centre médical avec électricité et ressources',
            },
            {
                'nom': 'Mairie de Thiaroye',
                'type_refuge': 'mairie',
                'quartier': 'Thiaroye Centre',
                'adresse': 'Place Publique, Thiaroye',
                'localisation': 'POINT(-17.3795 14.7590)',
                'capacite': 250,
                'contact': '+221 77 XXX XXXX',
                'hauteur_etage': 2,
                'notes': 'Bâtiment administratif avec stockage de ressources',
            },
            {
                'nom': 'Centre Communautaire Thiaroye Nord',
                'type_refuge': 'bâtiment_public',
                'quartier': 'Thiaroye Nord',
                'adresse': 'Route de Malika, Thiaroye Nord',
                'localisation': 'POINT(-17.3750 14.7640)',
                'capacite': 200,
                'contact': '+221 77 XXX XXXX',
                'hauteur_etage': 1,
                'notes': 'Centre surélevé pour accueil des évacués',
            },
            {
                'nom': 'École Secondaire Thiaroye Ouest',
                'type_refuge': 'ecole',
                'quartier': 'Thiaroye Ouest',
                'adresse': 'Quartier Ouest, Thiaroye',
                'localisation': 'POINT(-17.3850 14.7580)',
                'capacite': 350,
                'contact': '+221 77 XXX XXXX',
                'hauteur_etage': 2,
                'notes': 'Établissement moderne avec capacité intermédiaire',
            },
            {
                'nom': 'Mosquée Thiaroye Est',
                'type_refuge': 'mosquee',
                'quartier': 'Thiaroye Est',
                'adresse': 'Quartier Est, Thiaroye',
                'localisation': 'POINT(-17.3700 14.7600)',
                'capacite': 180,
                'contact': '+221 77 XXX XXXX',
                'notes': 'Mosquée communautaire avec bonne infrastructure',
            },
            {
                'nom': 'Centre Sportif Thiaroye',
                'type_refuge': 'bâtiment_public',
                'quartier': 'Thiaroye Centre',
                'adresse': 'Rue du Stade, Thiaroye',
                'localisation': 'POINT(-17.3825 14.7615)',
                'capacite': 400,
                'contact': '+221 77 XXX XXXX',
                'hauteur_etage': 1,
                'notes': 'Grand hall de sport, bonne ventilation et espace',
            },
        ]

        created_count = 0
        for data in refuges_data:
            try:
                localisation = data.pop('localisation')
                quartier = data['quartier']
                zone = zones.get(quartier, default_zone)

                refuge = PointRefuge.objects.create(
                    **data,
                    zone=zone,
                    localisation=localisation,
                    actif=True,
                )

                self.stdout.write(
                    f"  {refuge.nom} ({refuge.get_type_refuge_display()}) — {refuge.quartier}"
                )
                created_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error creating {data.get('nom')}: {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n[OK] Successfully created {created_count} refuge points')
        )
        self.stdout.write(
            self.style.WARNING(
                'Note: Coordinates are approximate. Update them with real GPS data as it becomes available.'
            )
        )
