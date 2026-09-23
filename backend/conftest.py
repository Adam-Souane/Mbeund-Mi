import os
import sys
import django
from django.conf import settings

# Add mbeund_mi_ia to sys.path so ia modules can be imported
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
mbeund_mi_ia_path = os.path.join(project_root, 'mbeund_mi_ia')
if mbeund_mi_ia_path not in sys.path:
    sys.path.insert(0, mbeund_mi_ia_path)

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.dev')

# Setup Django
def pytest_configure():
    """Configure pytest with Django"""
    django.setup()

    # Configure Celery for tests: execute tasks synchronously (eager mode)
    from django.conf import settings
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True

def pytest_collection(session):
    """Ensure sys.path is set before test collection"""
    # sys.path already set above at module import time
    pass
