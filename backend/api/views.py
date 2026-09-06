from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Utilisateur, ZonePilote, SegmentRue, ObservationTerrain,
    CapteurIoT, PrevisionMeteo, Alerte, HistoriqueRisque
)
from .serializers import (
    UtilisateurSerializer, ZonePiloteSerializer, SegmentRueSerializer,
    ObservationTerrainSerializer, CapteurIoTSerializer, PrevisionMeteoSerializer,
    AlerteSerializer, HistoriqueRisqueSerializer
)

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer


class ZonePiloteViewSet(viewsets.ModelViewSet):
    queryset = ZonePilote.objects.all()
    serializer_class = ZonePiloteSerializer

    @action(detail=True, methods=['get'])
    def observations(self, request, pk=None):
        """Retourne toutes les observations situées géographiquement dans cette zone pilote."""
        zone = self.get_object()
        observations = ObservationTerrain.objects.filter(geom__within=zone.geom)
        serializer = ObservationTerrainSerializer(observations, many=True)
        return Response(serializer.data)


class SegmentRueViewSet(viewsets.ModelViewSet):
    queryset = SegmentRue.objects.all()
    serializer_class = SegmentRueSerializer


class ObservationTerrainViewSet(viewsets.ModelViewSet):
    queryset = ObservationTerrain.objects.all().order_by('-date_observation')
    serializer_class = ObservationTerrainSerializer


class CapteurIoTViewSet(viewsets.ModelViewSet):
    queryset = CapteurIoT.objects.all()
    serializer_class = CapteurIoTSerializer


class PrevisionMeteoViewSet(viewsets.ModelViewSet):
    queryset = PrevisionMeteo.objects.all().order_by('-date_prevision')
    serializer_class = PrevisionMeteoSerializer


class AlerteViewSet(viewsets.ModelViewSet):
    queryset = Alerte.objects.all().order_by('-date_emission')
    serializer_class = AlerteSerializer

    @action(detail=False, methods=['get'])
    def actives(self, request):
        """Retourne uniquement les alertes actives."""
        alertes_actives = Alerte.objects.filter(statut='ACTIVE')
        serializer = self.get_serializer(alertes_actives, many=True)
        return Response(serializer.data)


class HistoriqueRisqueViewSet(viewsets.ModelViewSet):
    queryset = HistoriqueRisque.objects.all().order_by('-date_calcul')
    serializer_class = HistoriqueRisqueSerializer
