import environ
import os
from datetime import timedelta
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# base.py is located in backend/mbeund_mi_backend/settings/base.py, so we go up 3 levels to reach backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Initialize environ
env = environ.Env(
    DEBUG=(bool, False),
    USE_GIS=(bool, False),
)

# Reading .env file
env_file = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_file):
    environ.Env.read_env(env_file)

# SECURITY WARNING: keep the secret key used in production secret!
# Pas de valeur par défaut : SECRET_KEY signe aussi les JWT (voir SIMPLE_JWT plus bas),
# une valeur codée en dur dans un dépôt public serait un secret compromis d'avance.
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG')

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Déterminer si on charge les fonctionnalités GIS (GeoDjango / PostGIS)
USE_GIS = env('USE_GIS')

# Chemins vers les DLL GDAL/GEOS sous Windows (ex: installation OSGeo4W).
# Sans effet sur Linux/Mac où ces bibliothèques sont trouvées automatiquement.
if USE_GIS:
    GDAL_LIBRARY_PATH = env('GDAL_LIBRARY_PATH', default=None)
    GEOS_LIBRARY_PATH = env('GEOS_LIBRARY_PATH', default=None)


# Application definition

INSTALLED_APPS = [
    'daphne',  # Daphne must be before staticfiles
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party applications
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'channels',
    'django_celery_beat',

    # Local project applications
    'users',
    'capteurs',
    'alertes',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mbeund_mi_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mbeund_mi_backend.wsgi.application'
ASGI_APPLICATION = 'mbeund_mi_backend.asgi.application'


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'Africa/Dakar'  # Thiaroye Sur Mer, Dakar, Sénégal

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Limite le débit des requêtes anonymes (surtout /api/signalements/, seul
    # endpoint ouvert sans authentification) et des utilisateurs authentifiés.
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/hour',
        'user': '1000/hour',
    },
    # Pas de pagination par défaut : appliquée au cas par cas (voir api/views.py)
    # uniquement sur les modèles qui grossissent en continu (mesures, alertes,
    # signalements, prévisions, historique) — pas sur les données bornées
    # (zones, capteurs, segments) pour ne pas casser leur contrat GeoJSON.
    'PAGE_SIZE': 50,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Documentation API générée automatiquement (Swagger/Redoc) — voir mbeund_mi_backend/urls.py
SPECTACULAR_SETTINGS = {
    'TITLE': 'MBEUND MI — API',
    'DESCRIPTION': "API de la plateforme de prévention des inondations de Thiaroye-sur-Mer.",
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# SimpleJWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# Celery Configuration
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://redis:6379/1')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://redis:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

CELERY_BEAT_SCHEDULE = {
    'analyse-gee-periodique': {
        'task': 'alertes.tasks.analyse_gee_periodique',
        'schedule': timedelta(hours=12),
    },
}

# Twilio Configuration (SMS Alerting – tout provient du .env)
TWILIO_ACCOUNT_SID = env('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = env('TWILIO_AUTH_TOKEN', default='')
TWILIO_PHONE_NUMBER = env('TWILIO_PHONE_NUMBER', default='')
TWILIO_MESSAGING_SERVICE_SID = env('TWILIO_MESSAGING_SERVICE_SID', default='')

# Firebase Configuration (Push Notifications – tout provient du .env)
FIREBASE_CREDENTIALS_PATH = env('FIREBASE_CREDENTIALS_PATH', default=str(BASE_DIR / 'firebase_credentials.json'))

# Mosquitto MQTT Configuration (IoT – tout provient du .env)
MOSQUITTO_HOST = env('MOSQUITTO_HOST', default='localhost')
MOSQUITTO_PORT = env.int('MOSQUITTO_PORT', default=1883)
MQTT_USERNAME = env('MQTT_USERNAME', default='')
MQTT_PASSWORD = env('MQTT_PASSWORD', default='')

# CORS Configuration (Frontend React — NGODEV)
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:3000', 'http://127.0.0.1:3000',
])

# PAGE_SIZE est volontairement global tandis que pagination_class est défini
# par vue (voir api/views.py) — seuls les modèles qui grossissent en continu
# sont paginés. rest_framework.W001 est donc un faux positif attendu.
SILENCED_SYSTEM_CHECKS = ['rest_framework.W001']

