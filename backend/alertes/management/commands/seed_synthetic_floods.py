"""
Django management command to seed synthetic flood episodes based on real rainfall data.

This creates realistic flood episodes for demonstration/backtesting purposes,
flagged as is_synthetic=True so they don't pollute production data.

Usage:
    python manage.py seed_synthetic_floods
"""
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import MultiPolygon, Polygon
import pandas as pd
from datetime import datetime, timedelta
import os
from alertes.models import EpisodeInondation


class Command(BaseCommand):
    help = 'Seed synthetic flood episodes based on Open-Meteo rainfall peaks (>50mm)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--threshold',
            type=float,
            default=50.0,
            help='Rainfall threshold in mm to consider as potential flood (default: 50)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all synthetic episodes before seeding',
        )

    def handle(self, *args, **options):
        threshold = options['threshold']

        if options['clear']:
            count = EpisodeInondation.objects.filter(is_synthetic=True).delete()[0]
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {count} synthetic episodes')
            )

        # Load rainfall data
        # Go up from backend/alertes/management/commands/ to root
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        csv_path = os.path.join(base_path, 'mbeund_mi_ia', 'data', 'pluies_dakar_2010_2024_openmeteo.csv')

        if not os.path.exists(csv_path):
            self.stdout.write(
                self.style.ERROR(f'Rainfall CSV not found at {csv_path}')
            )
            return

        self.stdout.write(f'Loading rainfall data from {csv_path}...')
        df = pd.read_csv(csv_path)
        df['date'] = pd.to_datetime(df['date'])

        # Find rainfall peaks
        peaks = df[df['pluie_mm'] > threshold].sort_values('date')

        if len(peaks) == 0:
            self.stdout.write(
                self.style.WARNING(f'No rainfall peaks found above {threshold}mm')
            )
            return

        self.stdout.write(f'Found {len(peaks)} rainfall peaks above {threshold}mm')

        # Thiaroye coordinates for creating the geometry
        # Simplified MultiPolygon representing Thiaroye-sur-Mer area
        thiaroye_coords = [
            ((-17.41, 14.74), (-17.40, 14.74), (-17.40, 14.75), (-17.41, 14.75), (-17.41, 14.74))
        ]
        thiaroye_poly = Polygon(thiaroye_coords[0])
        thiaroye_geom = MultiPolygon([thiaroye_poly])

        # Create episodes from peaks, avoiding duplicates within 7 days
        created_count = 0
        last_date = None

        for _, row in peaks.iterrows():
            date_debut = row['date']

            # Skip if already have an episode within 7 days
            if last_date and (date_debut - last_date).days < 7:
                continue

            # Check if already exists
            if EpisodeInondation.objects.filter(
                date_debut__date=date_debut.date(),
                is_synthetic=True
            ).exists():
                continue

            pluie_mm = row['pluie_mm']
            date_fin = date_debut + timedelta(days=2)  # Typical flood duration

            # Estimate surface based on rainfall intensity
            # More rain = larger affected area
            surface_ha = 30 + (pluie_mm / 2)

            episode = EpisodeInondation.objects.create(
                date_debut=date_debut,
                date_fin=date_fin,
                surface_ha=round(surface_ha, 1),
                geom=thiaroye_geom,
                is_synthetic=True
            )

            self.stdout.write(
                f'  {date_debut.strftime("%Y-%m-%d")}: {pluie_mm}mm rainfall → {surface_ha:.0f}ha flood area'
            )

            created_count += 1
            last_date = date_debut

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully created {created_count} synthetic flood episodes')
        )
        self.stdout.write(
            self.style.WARNING(
                'Note: These are marked as is_synthetic=True. '
                'Backtesting will ignore them in production (only count real floods).'
            )
        )
