from django.apps import AppConfig


class AlertesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'alertes'

    def ready(self):
        import alertes.signals  # noqa: F401  (enregistre les récepteurs de signaux)
