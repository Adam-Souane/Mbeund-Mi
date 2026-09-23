from django.db.models.signals import post_save
from django.dispatch import receiver
from alertes.models import Alerte, SignalementCitoyen
from users.models import AuthorityActivity

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
def declencher_envoi_sms(sender, instance, created, **kwargs):
    """Déclenche l'envoi de SMS pour les alertes orange/rouge créées"""
    if created and instance.niveau in ('orange', 'rouge'):
        from alertes.tasks import envoyer_sms_alerte
        envoyer_sms_alerte.delay(instance.id)

@receiver(post_save, sender=SignalementCitoyen)
def log_signalement_validation(sender, instance, created, **kwargs):
    """Enregistre quand un signalement devient validé"""
    # Only log if signalement was just validated (changed from False to True)
    # Check if this is an update and validation status changed
    if not created and instance.valide and instance.signale_par:
        # Check if validation status just changed (was False before)
        try:
            old_instance = SignalementCitoyen.objects.get(pk=instance.pk)
            # Only log if it wasn't validated before
            if not getattr(old_instance, 'valide', False):
                AuthorityActivity.objects.create(
                    authority=instance.signale_par,
                    action_type='request_handled',
                    description=f'Signalement validé: {instance.get_categorie_display()}',
                    zone='',
                )
        except SignalementCitoyen.DoesNotExist:
            pass
