from .base import *

# Development settings
DEBUG = True

# Database configuration (PostGIS if USE_GIS=True, otherwise SQLite)
if USE_GIS:
    INSTALLED_APPS.append('django.contrib.gis')
    DATABASES = {
        'default': env.db('DATABASE_URL', default='postgis://postgres:postgres@db:5432/mbeund_mi_db')
    }
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [env('REDIS_URL', default='redis://redis:6379/0')],
            },
        },
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
