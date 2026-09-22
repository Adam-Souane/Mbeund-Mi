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

@receiver(post_save, sender=SignalementCitoyen)
def log_signalement_validation(sender, instance, created, **kwargs):
    """Enregistre quand un signalement est validé"""
    if instance.valide and instance.signale_par:
        AuthorityActivity.objects.create(
            authority=instance.signale_par,
            action_type='request_handled',
            description=f'Signalement validé: {instance.get_categorie_display()}',
            zone='',
        )
