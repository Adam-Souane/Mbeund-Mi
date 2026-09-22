from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import secrets
from django.utils import timezone

class InviteCode(models.Model):
    code = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_invites_used')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_invites_created')

    class Meta:
        verbose_name = "Code d'invitation Admin"
        verbose_name_plural = "Codes d'invitation Admin"

    def __str__(self):
        return f"Code {self.code[:8]}... {'utilisé' if self.used else 'actif'}"

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at

    @staticmethod
    def generate_code():
        return secrets.token_urlsafe(32)

class Profile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('autorite', 'Autorité'),
        ('agent', 'Agent terrain'),
        ('citoyen', 'Citoyen'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citoyen')
    telephone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False, help_text="L'utilisateur a vérifié son identité via OTP")

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"

    def __str__(self):
        return f"{self.user.username} - {self.role}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

class AuthorityTracking(models.Model):
    """Suivi des actions et statistiques d'une autorité"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tracking')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='authorities_created')

    # Statistiques
    crises_gerees = models.IntegerField(default=0, help_text="Nombre de crises gérées")
    requetes_traitees = models.IntegerField(default=0, help_text="Nombre de requêtes/signalements traités")
    alertes_envoyees = models.IntegerField(default=0, help_text="Nombre d'alertes envoyées")
    heures_travail = models.DecimalField(max_digits=5, decimal_places=1, default=0, help_text="Heures de travail estimées")

    # Dates
    date_creation_compte = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    premiere_action = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Suivi d'autorité"
        verbose_name_plural = "Suivi d'autorités"

    def __str__(self):
        return f"Suivi de {self.user.username}"


class AuthorityActivity(models.Model):
    """Historique des activités d'une autorité"""
    ACTION_TYPES = [
        ('alert_sent', 'Alerte envoyée'),
        ('request_handled', 'Requête traitée'),
        ('crisis_managed', 'Crise gérée'),
        ('login', 'Connexion'),
        ('dashboard_view', 'Dashboard consulté'),
        ('report_generated', 'Rapport généré'),
    ]

    authority = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField(blank=True)
    zone = models.CharField(max_length=200, blank=True, help_text="Zone concernée si applicable")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Activité d'autorité"
        verbose_name_plural = "Activités d'autorité"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['authority', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.authority.username} - {self.get_action_type_display()}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        if instance.profile.role == 'autorite':
            AuthorityTracking.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Sécurité au cas où le profil n'a pas été créé
    if not hasattr(instance, 'profile'):
        Profile.objects.create(user=instance)
    instance.profile.save()


def log_authority_login(sender, request, user, **kwargs):
    """Signal pour enregistrer les connexions des autorités"""
    if user.profile.role == 'autorite':
        AuthorityActivity.objects.create(
            authority=user,
            action_type='login',
            description='Connexion au système',
        )

        # Mettre à jour la dernière connexion dans le tracking
        if hasattr(user, 'tracking'):
            user.tracking.derniere_connexion = timezone.now()
            user.tracking.save()
