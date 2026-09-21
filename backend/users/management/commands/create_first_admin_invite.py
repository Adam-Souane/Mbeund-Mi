from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import InviteCode


class Command(BaseCommand):
    help = 'Génère un code d\'invitation pour le premier admin'

    def handle(self, *args, **options):
        # Générer un code d'invitation
        invite = InviteCode.objects.create(
            code=InviteCode.generate_code(),
            expires_at=timezone.now() + timedelta(hours=48),
            role='admin',
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Code d\'invitation généré avec succès !\n\n'
                f'Code: {invite.code}\n'
                f'Rôle: {invite.role}\n'
                f'Valide jusqu\'au: {invite.expires_at}\n\n'
                f'Utilisez ce code pour créer le premier admin sur la page /admin-register'
            )
        )
