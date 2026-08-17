from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from capteurs.models import Capteur, Mesure
from api.serializers import CapteurSerializer, MesureSerializer

class CapteurViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Capteur. Exposes standard GET/POST/PUT/DELETE.
    """
    queryset = Capteur.objects.all()
    serializer_class = CapteurSerializer


class MesureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Mesure. Exposes standard GET/POST/PUT/DELETE,
    and a custom action `/api/mesures/recentes/`.
    """
    queryset = Mesure.objects.all()
    serializer_class = MesureSerializer

    @action(detail=False, methods=['get'], url_path='recentes')
    def recentes(self, request):
        """
        GET /api/mesures/recentes/
        Returns measurements from the last 24 hours, grouped by capteur.
        Each capteur is represented as a GeoJSON feature, with its recent measurements list.
        """
        # Threshold for the last 24 hours
        time_threshold = timezone.now() - timedelta(hours=24)
        
        # We query measures in the last 24 hours and prefetch capteurs to optimize
        mesures = Mesure.objects.filter(timestamp__gte=time_threshold).select_related('capteur')
        
        # Grouping by sensor
        grouped = {}
        for m in mesures:
            capteur_id = m.capteur_id
            if capteur_id not in grouped:
                # Serialize the capteur using CapteurSerializer
                capteur_data = CapteurSerializer(m.capteur).data
                grouped[capteur_id] = {
                    "capteur": capteur_data,
                    "mesures": []
                }
            grouped[capteur_id]["mesures"].append({
                "id": m.id,
                "valeur": m.valeur,
                "unite": m.unite,
                "timestamp": m.timestamp.isoformat()
            })
            
        return Response(list(grouped.values()))
