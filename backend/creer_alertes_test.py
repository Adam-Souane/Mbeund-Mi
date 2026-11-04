#!/usr/bin/env python
"""
Script pour initialiser les alertes de test dans la base locale.
Usage : python creer_alertes_test.py
"""
import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.dev')
django.setup()

from alertes.models import Alerte, ZoneRisque
from django.utils import timezone

zones = {z.quartier: z for z in ZoneRisque.objects.all()}
zone_ouest = next((z for k, z in zones.items() if 'Cuvette Ouest' in k), None)
zone_ndakhane = next((z for k, z in zones.items() if 'Ndakhane' in k), None)
zone_gare = next((z for k, z in zones.items() if 'Gare' in k), None)

now = timezone.now()

created = 0
if zone_ouest and not Alerte.objects.filter(zone=zone_ouest).exists():
    Alerte.objects.create(
        niveau='rouge',
        zone=zone_ouest,
        message='Vigilance Rouge · Débordement imminent de la cuvette ouest. Bassin de rétention à 90% de sa capacité, refoulement pluvial signalé vers les concessions basses.',
        timestamp=now - timedelta(minutes=35),
        canaux='SMS, Web, Sirène',
        statut='envoyee'
    )
    created += 1

if zone_ndakhane and not Alerte.objects.filter(zone=zone_ndakhane).exists():
    Alerte.objects.create(
        niveau='orange',
        zone=zone_ndakhane,
        message='Vigilance Orange · Montée des eaux pluviales au carrefour Ndakhane. Caniveau principal saturé, déviation piétons recommandée.',
        timestamp=now - timedelta(hours=1, minutes=15),
        canaux='SMS, Web',
        statut='envoyee'
    )
    created += 1

if zone_gare and not Alerte.objects.filter(zone=zone_gare).exists():
    Alerte.objects.create(
        niveau='jaune',
        zone=zone_gare,
        message='Vigilance Jaune · Voie d’accès au marché temporairement ralentie par accumulation d’eau. Situation en cours de sécurisation par curage.',
        timestamp=now - timedelta(hours=3),
        canaux='Web',
        statut='resolue'
    )
    created += 1

print(f"{created} nouvelles alertes créées. Total en base : {Alerte.objects.count()}")
