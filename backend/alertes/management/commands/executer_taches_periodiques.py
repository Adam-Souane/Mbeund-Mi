"""
Commande de gestion Django permettant d'exécuter les tâches périodiques (météo, prédictions IA, GEE)
sans nécessiter de service Celery Beat / Worker d'arrière-plan permanent payant sur Render.

Usage :
    python manage.py executer_taches_periodiques
    python manage.py executer_taches_periodiques --meteo
    python manage.py executer_taches_periodiques --predictions
    python manage.py executer_taches_periodiques --gee
"""
import logging
from django.core.management.base import BaseCommand
from alertes.tasks import (
    mettre_a_jour_previsions_meteo,
    predire_risques_avec_random_forest,
    analyse_gee_periodique,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Exécute à la demande ou via cron les tâches périodiques d'alertes, météo et prédictions IA."

    def add_arguments(self, parser):
        parser.add_argument(
            '--meteo',
            action='store_true',
            help='Exécute uniquement la mise à jour des prévisions météo',
        )
        parser.add_argument(
            '--predictions',
            action='store_true',
            help='Exécute uniquement les prédictions de risques IA (Random Forest / LSTM)',
        )
        parser.add_argument(
            '--gee',
            action='store_true',
            help="Exécute uniquement l'analyse satellite périodique GEE",
        )

    def handle(self, *args, **options):
        executer_tout = not (options['meteo'] or options['predictions'] or options['gee'])

        if executer_tout or options['meteo']:
            self.stdout.write("-> Lancement de la mise à jour météo...")
            try:
                res = mettre_a_jour_previsions_meteo()
                self.stdout.write(self.style.SUCCESS(f"  [OK] Météo mise à jour : {res}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [ERREUR] Mise à jour météo : {e}"))

        if executer_tout or options['predictions']:
            self.stdout.write("-> Lancement des prédictions IA (Random Forest)...")
            try:
                res = predire_risques_avec_random_forest()
                self.stdout.write(self.style.SUCCESS(f"  [OK] Prédictions IA calculées : {res}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [ERREUR] Prédictions IA : {e}"))

        if executer_tout or options['gee']:
            self.stdout.write("-> Lancement de l'analyse satellite GEE...")
            try:
                res = analyse_gee_periodique()
                self.stdout.write(self.style.SUCCESS(f"  [OK] Analyse satellite terminée : {res}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [ERREUR] Analyse satellite : {e}"))

        self.stdout.write(self.style.SUCCESS("Exécution des tâches terminée avec succès."))
