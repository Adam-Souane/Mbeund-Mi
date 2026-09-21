from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import secrets

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

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Sécurité au cas où le profil n'a pas été créé
    if not hasattr(instance, 'profile'):
        Profile.objects.create(user=instance)
    instance.profile.save()


class InviteCode(models.Model):
    code = models.CharField(max_length=32, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='used_invites')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_invites')
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('autorite', 'Autorité')], default='admin')

    class Meta:
        verbose_name = "Code d'invitation"
        verbose_name_plural = "Codes d'invitation"

    def __str__(self):
        status = "Utilisé" if self.used_at else "Actif" if self.is_valid() else "Expiré"
        return f"{self.code} ({status})"

    def is_valid(self):
        return self.used_at is None and timezone.now() < self.expires_at

    @staticmethod
    def generate_code():
        return secrets.token_urlsafe(24)
