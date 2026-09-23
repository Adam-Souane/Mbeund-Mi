from django.apps import AppConfig


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
            print("[INFO] Firebase credentials file not found - skipping initialization")
        except json.JSONDecodeError as e:
            print(f"[ERREUR] Firebase JSON invalide: {e}")
        except Exception as e:
            print(f"[ERREUR] Échec de l'initialisation de Firebase: {e}")
