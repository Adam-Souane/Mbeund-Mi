import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from alertes.models import Alerte, SignalementCitoyen, SMSSignalement
from users.models import AuthorityActivity

logger = logging.getLogger(__name__)


def _diffuser(groupe, type_message, donnees):
    """Envoie un message aux clients WebSocket d'un groupe (voir alertes/consumers.py)."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning("Channel layer non configuré : diffusion WebSocket impossible.")
        return
    async_to_sync(channel_layer.group_send)(groupe, {"type": type_message, "data": donnees})


@receiver(post_save, sender=Alerte)
def log_alerte_creation(sender, instance, created, **kwargs):
    """Enregistre quand une alerte est créée"""
    if created and instance.created_by:
        AuthorityActivity.objects.create(
            authority=instance.created_by,
            action_type='alert_sent',
            description=f'Alerte {instance.get_niveau_display()} envoyée',
            zone=instance.zone.quartier,
        )


@receiver(post_save, sender=Alerte)
def broadcast_alerte(sender, instance, created, **kwargs):
    """Diffuse toute nouvelle alerte en temps réel (WebSocket) et en notification push."""
    if not created:
        return
    try:
        from api.serializers import AlerteSerializer
        _diffuser("alertes", "send_alerte", AlerteSerializer(instance).data)
    except Exception as e:
        logger.error(f"Échec de la diffusion WebSocket de l'alerte {instance.id} : {e}", exc_info=True)

    # Notification push (Firebase) pour les niveaux qui demandent une action
    if instance.niveau in ('orange', 'rouge'):
        try:
            from api.firebase_service import envoyer_notification_push
            envoyer_notification_push(
                f"Alerte {instance.get_niveau_display()} — {instance.zone.quartier}",
                instance.message or "Risque d'inondation : suivez les consignes MBEUND MI.",
            )
        except Exception as e:
            logger.error(f"Échec de la notification push de l'alerte {instance.id} : {e}", exc_info=True)


@receiver(post_save, sender=Alerte)
def declencher_envoi_sms(sender, instance, created, **kwargs):
    """Déclenche l'envoi de SMS pour les alertes orange/rouge créées.

    Seul point d'envoi des SMS orange/rouge : les tâches de prédiction ne
    l'appellent plus elles-mêmes pour ces niveaux, afin d'éviter les doublons.
    """
    if created and instance.niveau in ('orange', 'rouge'):
        from alertes.tasks import envoyer_sms_alerte
        envoyer_sms_alerte.delay(instance.id)


@receiver(post_save, sender=SignalementCitoyen)
def broadcast_signalement(sender, instance, created, **kwargs):
    """Signale aux autorités, en temps réel, tout nouveau signalement à valider."""
    if not created:
        return
    try:
        from api.serializers import SignalementCitoyenSerializer
        _diffuser("autorite_notifications", "send_signalement", SignalementCitoyenSerializer(instance).data)
    except Exception as e:
        logger.error(f"Échec de la diffusion WebSocket du signalement {instance.id} : {e}", exc_info=True)


@receiver(post_save, sender=SMSSignalement)
def broadcast_sms_signalement(sender, instance, created, **kwargs):
    """Signale aux autorités, en temps réel, tout SMS de signalement reçu."""
    if not created:
        return
    try:
        from api.serializers import SMSSignalementSerializer
        _diffuser("autorite_notifications", "send_sms", SMSSignalementSerializer(instance).data)
    except Exception as e:
        logger.error(f"Échec de la diffusion WebSocket du SMS {instance.id} : {e}", exc_info=True)
