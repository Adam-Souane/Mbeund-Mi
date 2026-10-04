import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import os
        import json
        import firebase_admin
        from firebase_admin import credentials
        from django.conf import settings

        if firebase_admin._apps:
            return
        try:
            creds_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
            if creds_json:
                cred = credentials.Certificate(json.loads(creds_json))
            else:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        except FileNotFoundError:
            logger.info("Identifiants Firebase absents : notifications push désactivées")
        except json.JSONDecodeError as e:
            logger.error("Identifiants Firebase illisibles (JSON invalide) : %s", e)
        except Exception as e:
            logger.error("Échec de l'initialisation de Firebase : %s", e)
