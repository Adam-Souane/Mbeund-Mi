#!/usr/bin/env python
"""
Script pour initialiser les comptes de test (Citoyen & Autorité) avec des identifiants simples.
Usage : python creer_comptes_test.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.dev')
django.setup()

from django.contrib.auth.models import User
from users.models import Profile

COMPTES = [
    {
        'username': 'citoyen',
        'password': 'Password123!',
        'email': 'citoyen@mbeund-mi.sn',
        'first_name': 'Fatou',
        'last_name': 'Diop',
        'role': 'citoyen',
        'telephone': '+221771234567',
    },
    {
        'username': 'autorite',
        'password': 'Password123!',
        'email': 'autorite@mbeund-mi.sn',
        'first_name': 'Moussa',
        'last_name': 'Ndiaye',
        'role': 'autorite',
        'telephone': '+221781234567',
        'is_staff': True,
    },
]

print("=== Initialisation des comptes de test Mbeund-Mi ===")
for c in COMPTES:
    user, created = User.objects.get_or_create(username=c['username'])
    user.set_password(c['password'])
    user.email = c['email']
    user.first_name = c['first_name']
    user.last_name = c['last_name']
    if c.get('is_staff'):
        user.is_staff = True
    user.save()

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = c['role']
    profile.telephone = c['telephone']
    profile.is_verified = True
    profile.verification_requise = False
    profile.save()

    statut = "CRÉÉ" if created else "MIS À JOUR"
    print(f"[{statut}] {c['role'].upper()} : Identifiant = {c['username']} | Mot de passe = {c['password']}")

print("\nTerminé ! Ces comptes sont utilisables immédiatement sur la page de connexion.")
