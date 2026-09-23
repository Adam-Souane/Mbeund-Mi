from .dev import *

# Disable rate throttling for tests to avoid "Too Many Requests" errors
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}
