from .base import *

# Development settings
DEBUG = True

# Database configuration (PostGIS if USE_GIS=True, otherwise SQLite)
if USE_GIS:
    INSTALLED_APPS.append('django.contrib.gis')
    INSTALLED_APPS.append('rest_framework_gis')
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
    import redis
    redis_url = env('REDIS_URL', default='redis://127.0.0.1:6379/0')
    try:
        r = redis.Redis.from_url(redis_url, socket_timeout=1.0)
        r.ping()
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {
                    "hosts": [redis_url],
                },
            },
        }
    except Exception:
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels.layers.InMemoryChannelLayer',
            },
        }
