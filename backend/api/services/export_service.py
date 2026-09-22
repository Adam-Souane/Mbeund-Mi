"""
Service pour exporter les données d'alertes et signalements au format PDF/CSV.
Utilisé par l'autorité pour générer des rapports et documents de crise.
"""
import csv
import io
import logging
from datetime import datetime
from decimal import Decimal

from django.db.models import QuerySet
from alertes.models import (
    Alerte, SignalementCitoyen, ZoneRisque, PredictionIA,
    EpisodeInondation, PointRefuge
)

logger = logging.getLogger(__name__)


class ExportService:
    """Service d'export de données pour l'autorité."""

    @staticmethod
    def generer_csv_alertes(alertes_qs=None, depuis=None):
        """
        Génère un CSV des alertes.

        Args:
            alertes_qs: QuerySet d'alertes (sinon toutes)
            depuis: datetime pour filtrer (optionnel)

        Returns:
            (BytesIO CSV, nom_fichier)
        """
        if alertes_qs is None:
            alertes_qs = Alerte.objects.select_related('zone')
        if depuis:
            alertes_qs = alertes_qs.filter(timestamp__gte=depuis)

        alertes_qs = alertes_qs.order_by('-timestamp')

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'ID', 'Quartier (Zone)', 'Niveau', 'Statut',
            'Timestamp', 'Message', 'Date Expiration', 'Canaux'
        ])

        # Données
        for alerte in alertes_qs:
            writer.writerow([
                alerte.id,
                alerte.zone.quartier if alerte.zone else '—',
                alerte.get_niveau_display(),
                alerte.get_statut_display(),
                alerte.timestamp.isoformat() if alerte.timestamp else '—',
                alerte.message[:100] if alerte.message else '—',
                alerte.date_expiration.isoformat() if alerte.date_expiration else '—',
                alerte.canaux or '—',
            ])

        # Convertir en bytes
        output.seek(0)
        bytes_output = io.BytesIO(output.getvalue().encode('utf-8-sig'))

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"alertes_{timestamp}.csv"

        return bytes_output, filename

    @staticmethod
    def generer_csv_signalements(signalements_qs=None, depuis=None):
        """
        Génère un CSV des signalements citoyens.

        Args:
            signalements_qs: QuerySet de signalements (sinon tous)
            depuis: datetime pour filtrer (optionnel)

        Returns:
            (BytesIO CSV, nom_fichier)
        """
        if signalements_qs is None:
            signalements_qs = SignalementCitoyen.objects.select_related('signale_par')
        if depuis:
            signalements_qs = signalements_qs.filter(date_creation__gte=depuis)

        signalements_qs = signalements_qs.order_by('-date_creation')

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'ID', 'Catégorie', 'Niveau Eau Estimé', 'Score Eau',
            'Valide', 'Auteur', 'Date Création', 'Description'
        ])

        # Données
        for sig in signalements_qs:
            writer.writerow([
                sig.id,
                sig.get_categorie_display(),
                sig.get_niveau_eau_estime_display(),
                sig.score_eau_estime or '—',
                'Oui' if sig.valide else 'Non',
                sig.signale_par.username if sig.signale_par else 'SMS/Anonyme',
                sig.date_creation.isoformat() if sig.date_creation else '—',
                sig.description[:100] if sig.description else '—',
            ])

        # Convertir en bytes
        output.seek(0)
        bytes_output = io.BytesIO(output.getvalue().encode('utf-8-sig'))

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"signalements_{timestamp}.csv"

        return bytes_output, filename

    @staticmethod
    def generer_csv_zones_risque():
        """
        Génère un CSV des zones à risque.

        Returns:
            (BytesIO CSV, nom_fichier)
        """
        zones = ZoneRisque.objects.all().order_by('quartier')

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'ID', 'Quartier', 'Niveau Risque', 'Score Risque Moyen',
            'Description'
        ])

        # Données
        for zone in zones:
            writer.writerow([
                zone.id,
                zone.quartier,
                zone.get_niveau_risque_display(),
                zone.score_risque_moyen,
                zone.description[:100] if zone.description else '—',
            ])

        # Convertir en bytes
        output.seek(0)
        bytes_output = io.BytesIO(output.getvalue().encode('utf-8-sig'))

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"zones_risque_{timestamp}.csv"

        return bytes_output, filename

    @staticmethod
    def generer_csv_predictions():
        """
        Génère un CSV des prédictions IA.

        Returns:
            (BytesIO CSV, nom_fichier)
        """
        predictions = PredictionIA.objects.select_related('zone').order_by('-timestamp')[:1000]

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'ID', 'Zone (Quartier)', 'Probabilité', 'Confiance',
            'Horizon (h)', 'Niveau Eau Prédit (cm)', 'Timestamp'
        ])

        # Données
        for pred in predictions:
            writer.writerow([
                pred.id,
                pred.zone.quartier if pred.zone else '—',
                f"{pred.probabilite * 100:.1f}%",
                f"{pred.confiance:.1f}%",
                pred.horizon_h,
                pred.niveau_eau_predit_cm if pred.niveau_eau_predit_cm else '—',
                pred.timestamp.isoformat() if pred.timestamp else '—',
            ])

        # Convertir en bytes
        output.seek(0)
        bytes_output = io.BytesIO(output.getvalue().encode('utf-8-sig'))

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"predictions_ia_{timestamp}.csv"

        return bytes_output, filename

    @staticmethod
    def generer_csv_refuges():
        """
        Génère un CSV des points de refuge.

        Returns:
            (BytesIO CSV, nom_fichier)
        """
        refuges = PointRefuge.objects.select_related('zone').filter(actif=True).order_by('quartier')

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'ID', 'Nom', 'Type', 'Quartier', 'Adresse',
            'Capacité', 'Contact', 'Notes'
        ])

        # Données
        for refuge in refuges:
            writer.writerow([
                refuge.id,
                refuge.nom,
                refuge.get_type_refuge_display(),
                refuge.quartier,
                refuge.adresse or '—',
                refuge.capacite or '—',
                refuge.contact or '—',
                refuge.notes[:100] if refuge.notes else '—',
            ])

        # Convertir en bytes
        output.seek(0)
        bytes_output = io.BytesIO(output.getvalue().encode('utf-8-sig'))

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"refuges_{timestamp}.csv"

        return bytes_output, filename

    @staticmethod
    def generer_csv_episodes():
        """
        Génère un CSV des épisodes d'inondation.

        Returns:
            (BytesIO CSV, nom_fichier)
        """
        episodes = EpisodeInondation.objects.order_by('-date_debut')

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'ID', 'Date Début', 'Date Fin', 'Surface (ha)',
            'Type (Synthétique/Réel)'
        ])

        # Données
        for episode in episodes:
            writer.writerow([
                episode.id,
                episode.date_debut.isoformat() if episode.date_debut else '—',
                episode.date_fin.isoformat() if episode.date_fin else '—',
                episode.surface_ha or '—',
                'Test/Synthétique' if episode.is_synthetic else 'Réel',
            ])

        # Convertir en bytes
        output.seek(0)
        bytes_output = io.BytesIO(output.getvalue().encode('utf-8-sig'))

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"episodes_inondation_{timestamp}.csv"

        return bytes_output, filename
