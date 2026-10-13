import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import Profile


class Command(BaseCommand):
    help = "Initialise ou réinitialise le compte super-administrateur"

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'mbeundmi')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'mbeundmi2026')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@mbeundmi.sn')

        user, created = User.objects.get_or_create(username=username, defaults={'email': email})
        user.set_password(password)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()

        # Profil associé
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = 'admin'
        profile.is_verified = True
        profile.verification_requise = False
        profile.save()

        action = "créé" if created else "mis à jour (mot de passe synchronisé)"
        self.stdout.write(self.style.SUCCESS(f"Compte super-admin '{username}' {action} avec succès."))
