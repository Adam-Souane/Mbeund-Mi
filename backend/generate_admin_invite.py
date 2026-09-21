#!/usr/bin/env python
"""
Script pour générer un code d'invitation admin
Usage: python generate_admin_invite.py
"""
import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.dev')
django.setup()

from users.models import InviteCode

# Générer un code qui expire dans 48 heures
code = InviteCode.generate_code()
expires_at = timezone.now() + timedelta(hours=48)

invite = InviteCode.objects.create(
    code=code,
    expires_at=expires_at,
    created_by=None,  # Premier code créé manuellement
)

print("[OK] Code d'invitation genere avec succes !")
print(f"Code: {code}")
print(f"Expire dans 48 heures")
print(f"\nURL d'inscription admin:")
print(f"http://localhost:3000/admin-register?code={code}")
