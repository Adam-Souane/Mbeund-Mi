import os
import sys
import django
from pprint import pprint

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings')
django.setup()

from api.serializers import SignalementSerializer
from rest_framework.exceptions import ValidationError
from api.views import haversine_distance, SignalementViewSet

# 1. Test du calcul de distance
dist_thiaroye = haversine_distance(14.742, -17.406, 14.743, -17.405) # ~100m
dist_dakar_plateau = haversine_distance(14.742, -17.406, 14.67, -17.43) # ~8km

print(f"Distance Thiaroye -> Thiaroye : {dist_thiaroye:.2f} km")
print(f"Distance Thiaroye -> Dakar Plateau : {dist_dakar_plateau:.2f} km")

print("\n--- Test Insertion API (Simulation ViewSet) ---")
viewset = SignalementViewSet()

# Test Valide (Dans Thiaroye)
data_valide = {
    "type_probleme": "egout_bouche",
    "description": "Égout bouché devant la gare.",
    "latitude": 14.743,
    "longitude": -17.405
}

serializer_valide = SignalementSerializer(data=data_valide)
if serializer_valide.is_valid():
    try:
        viewset.perform_create(serializer_valide)
        print("[SUCCES] Signalement dans Thiaroye accepte !")
    except ValidationError as e:
        print(f"[ERREUR] {e.detail}")

# Test Invalide (Dakar Plateau)
data_invalide = {
    "type_probleme": "inondation",
    "description": "Fausse alerte depuis le Plateau.",
    "latitude": 14.67,
    "longitude": -17.43
}

serializer_invalide = SignalementSerializer(data=data_invalide)
if serializer_invalide.is_valid():
    try:
        viewset.perform_create(serializer_invalide)
        print("[ERREUR CRITIQUE] L'API a accepte un signalement hors zone !")
    except ValidationError as e:
        print(f"[SUCCES] L'API a bien bloque le signalement hors zone : {e.detail}")
