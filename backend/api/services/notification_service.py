"""
Service de notifications push temps réel via WebSocket.
Envoie les alertes et signalements aux autorités et citoyens en temps réel.
"""
import json
import logging
from typing import Dict, List
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


class NotificationService:
    """Service pour envoyer des notifications push temps réel."""

    NOTIFICATION_TYPES = {
        'alerte': 'Alerte de risque',
        'signalement': 'Nouveau signalement',
        'sms': 'SMS reçu',
        'prediction': 'Prédiction IA',
        'info': 'Information',
    }

    @staticmethod
    def envoyer_notification_autorite(type_notif: str, titre: str, message: str, data: Dict = None):
        """
        Envoie une notification à tous les utilisateurs autorité connectés.

        Args:
            type_notif: Type de notification (alerte, signalement, etc.)
            titre: Titre de la notification
            message: Contenu du message
            data: Données additionnelles (zone_id, alerte_id, etc.)
        """
        channel_layer = get_channel_layer()

        payload = {
            'type': 'notification_message',
            'notification': {
                'id': timezone.now().timestamp(),
                'type': type_notif,
                'titre': titre,
                'message': message,
                'timestamp': timezone.now().isoformat(),
                'data': data or {},
            }
        }

        try:
            async_to_sync(channel_layer.group_send)(
                'autorite_notifications',
                payload
            )
            logger.info(f"Notification envoyée aux autorités: {titre}")
        except Exception as e:
            logger.error(f"Erreur envoi notification autorité: {e}")

    @staticmethod
    def envoyer_notification_citoyens(type_notif: str, titre: str, message: str,
                                     zone_id: int = None, data: Dict = None):
        """
        Envoie une notification aux citoyens (filtrée par zone si spécifiée).

        Args:
            type_notif: Type de notification
            titre: Titre
            message: Contenu
            zone_id: Zone concernée (optionnel, pour filtrer)
            data: Données additionnelles
        """
        channel_layer = get_channel_layer()

        # Groupe par zone ou groupe général
        group_name = f'zone_notifications_{zone_id}' if zone_id else 'citoyen_notifications'

        payload = {
            'type': 'notification_message',
            'notification': {
                'id': timezone.now().timestamp(),
                'type': type_notif,
                'titre': titre,
                'message': message,
                'timestamp': timezone.now().isoformat(),
                'zone_id': zone_id,
                'data': data or {},
            }
        }

        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                payload
            )
            logger.info(f"Notification envoyée aux citoyens ({group_name}): {titre}")
        except Exception as e:
            logger.error(f"Erreur envoi notification citoyens: {e}")

    @staticmethod
    def envoyer_alerte_push(alerte):
        """
        Envoie une notification push quand une alerte est créée.

        Args:
            alerte: Instance Alerte
        """
        titre = f"Alerte {alerte.get_niveau_display().upper()}"
        message = f"Risque détecté à {alerte.zone.quartier}"

        # Notifier les autorités
        NotificationService.envoyer_notification_autorite(
            type_notif='alerte',
            titre=titre,
            message=message,
            data={
                'alerte_id': alerte.id,
                'zone_id': alerte.zone_id,
                'niveau': alerte.niveau,
                'quartier': alerte.zone.quartier,
                'message': alerte.message,
            }
        )

        # Notifier les citoyens de la zone
        if alerte.zone:
            NotificationService.envoyer_notification_citoyens(
                type_notif='alerte',
                titre=titre,
                message=message,
                zone_id=alerte.zone_id,
                data={
                    'alerte_id': alerte.id,
                    'niveau': alerte.niveau,
                    'quartier': alerte.zone.quartier,
                }
            )

    @staticmethod
    def envoyer_signalement_push(signalement):
        """
        Envoie une notification quand un nouveau signalement est créé.

        Args:
            signalement: Instance SignalementCitoyen
        """
        titre = "Nouveau signalement"
        message = f"Signalement d'inondation reçu : {signalement.get_categorie_display()}"

        # Notifier les autorités seulement
        NotificationService.envoyer_notification_autorite(
            type_notif='signalement',
            titre=titre,
            message=message,
            data={
                'signalement_id': signalement.id,
                'categorie': signalement.categorie,
                'description': signalement.description[:100],
                'valide': signalement.valide,
            }
        )

    @staticmethod
    def envoyer_prediction_push(zone, niveau_risque, probabilite):
        """
        Envoie une notification quand une prédiction de risque élevé est faite.

        Args:
            zone: Instance ZoneRisque
            niveau_risque: Niveau de risque (vert/jaune/orange/rouge)
            probabilite: Probabilité en pourcentage
        """
        if niveau_risque in ['orange', 'rouge']:
            titre = f"Prédiction {niveau_risque.upper()} - {zone.quartier}"
            message = f"Risque prédit à {probabilite*100:.0f}% pour les prochaines 12h"

            # Notifier autorités ET citoyens
            NotificationService.envoyer_notification_autorite(
                type_notif='prediction',
                titre=titre,
                message=message,
                data={
                    'zone_id': zone.id,
                    'niveau': niveau_risque,
                    'probabilite': probabilite,
                    'quartier': zone.quartier,
                }
            )

            NotificationService.envoyer_notification_citoyens(
                type_notif='prediction',
                titre=titre,
                message=message,
                zone_id=zone.id,
                data={
                    'zone_id': zone.id,
                    'niveau': niveau_risque,
                    'probabilite': probabilite,
                }
            )

    @staticmethod
    def envoyer_sms_recu_push(sms_signalement):
        """
        Envoie une notification quand un SMS est reçu.

        Args:
            sms_signalement: Instance SMSSignalement
        """
        titre = "SMS signalement reçu"
        message = f"SMS de {sms_signalement.telephone}: {sms_signalement.contenu_sms[:50]}..."

        # Notifier les autorités seulement
        NotificationService.envoyer_notification_autorite(
            type_notif='sms',
            titre=titre,
            message=message,
            data={
                'sms_id': sms_signalement.id,
                'telephone': sms_signalement.telephone,
                'contenu': sms_signalement.contenu_sms[:100],
                'localisation': sms_signalement.localisation_texte,
            }
        )


def notifier_alerte_creee(sender, instance, created, **kwargs):
    """Signal handler pour notifier quand une alerte est créée."""
    if created:
        NotificationService.envoyer_alerte_push(instance)


def notifier_signalement_cree(sender, instance, created, **kwargs):
    """Signal handler pour notifier quand un signalement est créé."""
    if created:
        NotificationService.envoyer_signalement_push(instance)


def notifier_sms_recu(sender, instance, created, **kwargs):
    """Signal handler pour notifier quand un SMS est reçu."""
    if created:
        NotificationService.envoyer_sms_recu_push(instance)
