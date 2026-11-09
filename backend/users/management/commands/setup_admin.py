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
        profile.service = 'cod'
        profile.is_verified = True
        profile.verification_requise = False
        profile.save()

        action = "créé" if created else "mis à jour (mot de passe synchronisé)"
        self.stdout.write(self.style.SUCCESS(f"Compte super-admin '{username}' {action} avec succès."))

        # Comptes autorités opérationnelles (BNSP, ONAS, Mairie)
        autorites_initiales = [
            ('autorite_bnsp', 'bnsp@mbeundmi.sn', 'Brigade', 'Sapeurs-Pompiers (BNSP)', 'bnsp', '+221770000018'),
            ('autorite_onas', 'onas@mbeundmi.sn', 'Direction', 'Assainissement (ONAS)', 'onas', '+221770000019'),
            ('autorite_mairie', 'mairie@mbeundmi.sn', 'Service Technique', 'Mairie de Pikine', 'mairie', '+221770000020'),
        ]
        default_auth_pwd = os.environ.get('DJANGO_AUTORITE_PASSWORD', 'Autorite2026!')
        for uname, uemail, fname, lname, svc, tel in autorites_initiales:
            u, u_created = User.objects.get_or_create(
                username=uname,
                defaults={'email': uemail, 'first_name': fname, 'last_name': lname, 'is_active': True},
            )
            if u_created:
                u.set_password(default_auth_pwd)
                u.save()
            p, _ = Profile.objects.get_or_create(user=u)
            p.role = 'autorite'
            p.service = svc
            if not p.telephone:
                p.telephone = tel
            p.is_verified = True
            p.verification_requise = False
            p.save()
