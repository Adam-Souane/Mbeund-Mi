from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import firebase_admin
        from firebase_admin import credentials
        from django.conf import settings

        if firebase_admin._apps:
            return
        try:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"[ERREUR] Échec de l'initialisation de Firebase: {e}")
