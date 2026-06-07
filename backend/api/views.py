from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from .models import Zone, Mesure, Alerte, Signalement
from .serializers import ZoneSerializer, MesureSerializer, AlerteSerializer, SignalementSerializer
from .firebase_service import envoyer_notification_push
import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calcule la distance en km entre deux points GPS."""
    R = 6371.0  # Rayon de la Terre en km
    
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer

class MesureViewSet(viewsets.ModelViewSet):
    queryset = Mesure.objects.all()
    serializer_class = MesureSerializer

class AlerteViewSet(viewsets.ModelViewSet):
    queryset = Alerte.objects.all()
    serializer_class = AlerteSerializer

    def perform_create(self, serializer):
        alerte = serializer.save()
        titre = f"ALERTE {alerte.niveau.upper()} - {alerte.zone.nom}"
        corps = alerte.message if alerte.message else "Risque critique d'inondation détecté. Prudence !"
        envoyer_notification_push(titre, corps)

class SignalementViewSet(viewsets.ModelViewSet):
    queryset = Signalement.objects.all().order_by('-timestamp')
    serializer_class = SignalementSerializer

    def perform_create(self, serializer):
        # Coordonnées centrales de Thiaroye Sur Mer
        THIAROYE_LAT = 14.742
        THIAROYE_LNG = -17.406
        MAX_DISTANCE_KM = 4.0  # L'utilisateur doit être dans un rayon de 4 km

        lat_user = serializer.validated_data.get('latitude')
        lng_user = serializer.validated_data.get('longitude')

        distance = haversine_distance(THIAROYE_LAT, THIAROYE_LNG, lat_user, lng_user)
        
        if distance > MAX_DISTANCE_KM:
            raise ValidationError({
                "erreur": f"Rejeté : Vous êtes à {distance:.1f} km de Thiaroye Sur Mer. Les signalements sont limités à cette zone."
            })
            
        serializer.save()
