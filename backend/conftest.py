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


@pytest.fixture(autouse=True)
def _celery_eager_pour_les_tests(settings):
    """
    Sans ça, chaque Alerte orange/rouge créée pendant les tests (via l'API ou
    l'ORM) déclenche un vrai `.delay()` d'envoyer_sms_alerte vers la file
    Celery/Redis de production (Upstash) — ces messages ne sont jamais
    consommés (aucun worker ne tourne pendant les tests) et s'y accumulent
    indéfiniment. Repéré via `celery purge` : 108 messages de test accumulés
    en une journée d'exécutions répétées de la suite.

    CELERY_TASK_ALWAYS_EAGER exécute la tâche en synchrone dans le process de
    test au lieu de la publier sur le broker — meilleure couverture (la
    logique tourne vraiment) sans toucher à l'infrastructure partagée.
    CELERY_TASK_EAGER_PROPAGATES=False évite qu'un échec interne à la tâche
    (ex: SMS) ne fasse échouer un test qui ne teste pas cette tâche.
    """
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = False
