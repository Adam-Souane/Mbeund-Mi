import os
import sys
import django

# Setup de l'environnement Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings')
django.setup()

from api.firebase_service import envoyer_notification_push

print("Test de Firebase Cloud Messaging...")
envoyer_notification_push(
    titre="ALERTE TEST - Mbeund Mi",
    corps="Ceci est un test de notification push envoyé depuis le Backend Django !",
    topic="thiaroye_alertes"
)
print("Vérifiez les logs ci-dessus pour confirmer le succès de l'envoi.")
