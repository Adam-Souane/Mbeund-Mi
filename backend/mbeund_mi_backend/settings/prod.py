from .base import *

# Production settings
DEBUG = False

# Enforce explicit allowed hosts in production
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# PostGIS is mandatory in production
INSTALLED_APPS.append('django.contrib.gis')
INSTALLED_APPS.append('rest_framework_gis')

DATABASES = {
    'default': env.db('DATABASE_URL')
}

# Redis Channel Layers is mandatory in production
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [env('REDIS_URL')],
        },
    },
}

# Security Headers (Production recommended)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=True)
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=True)
