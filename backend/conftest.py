import os
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings')

# Setup Django
def pytest_configure():
    """Configure pytest with Django"""
    django.setup()
