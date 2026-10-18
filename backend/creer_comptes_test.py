#!/usr/bin/env python
"""
Script pour initialiser ou réinitialiser les comptes de test dans la base locale.
Usage : python creer_comptes_test.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.dev')
django.setup()

from django.contrib.auth.models import User
from users.models import Profile, AuthorityTracking

COMPTES = [
    {
        'username': 'citoyen',
        'password': 'Password123!',
        'email': 'citoyen@mbeund-mi.sn',
        'first_name': 'Awa',
        'last_name': 'Diop',
        'telephone': '+221770000001',
        'role': 'citoyen',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'autorite',
        'password': 'Password123!',
        'email': 'autorite@mbeund-mi.sn',
        'first_name': 'Moussa',
        'last_name': 'Sow',
        'telephone': '+221770000002',
        'role': 'autorite',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'admin',
        'password': 'Password123!',
        'email': 'admin@mbeund-mi.sn',
        'first_name': 'Ousmane',
        'last_name': 'Ndiaye',
        'telephone': '+221770000003',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
    },
]

print("=== Creation et mise a jour des comptes de test ===")
for data in COMPTES:
    username = data['username']
    user, created = User.objects.get_or_create(username=username)
    user.set_password(data['password'])
    user.email = data['email']
    user.first_name = data['first_name']
    user.last_name = data['last_name']
    user.is_staff = data['is_staff']
    user.is_superuser = data['is_superuser']
    user.is_active = True
    user.save()

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = data['role']
    profile.telephone = data['telephone']
    profile.is_verified = True
    profile.verification_requise = False
    profile.save()

    if data['role'] in ('autorite', 'admin'):
        AuthorityTracking.objects.get_or_create(user=user)

    action = "Cree" if created else "Mis a jour"
    print(f"[{action}] {data['role'].upper()}: {username} / {data['password']}")

print("\nComptes prets a l'emploi !")
