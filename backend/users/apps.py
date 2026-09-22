from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        from django.contrib.auth.signals import user_logged_in
        from users.models import log_authority_login
        user_logged_in.connect(log_authority_login)
