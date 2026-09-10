import pytest


@pytest.fixture(autouse=True)
def _cache_local_isole_pour_les_tests(settings):
    """
    En dev/prod, CACHES pointe vers Redis (Upstash) — partagé entre workers,
    nécessaire pour que le rate limiting (throttling DRF) soit cohérent.
    En test, ce même cache partagé ferait fuiter les compteurs de throttle
    d'une exécution de la suite à l'autre (ex: anon 20/heure sur
    /api/signalements/), rendant les tests dépendants de l'historique récent.
    Un cache mémoire local, réinitialisé à chaque test, élimine ce risque.
    """
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
