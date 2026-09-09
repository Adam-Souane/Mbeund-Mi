from django.db.models import Subquery, OuterRef
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from rest_framework import permissions
from capteurs.models import Capteur, Mesure
from alertes.models import Alerte, ZoneRisque, PredictionIA, EpisodeInondation, SignalementCitoyen
from api.serializers import (
    CapteurSerializer,
    MesureSerializer,
    AlerteSerializer,
    ZoneRisqueGeoSerializer,
    PredictionIASerializer,
    EpisodeInondationSerializer,
    SignalementCitoyenSerializer
)
from api.permissions import IsAutoriteOrAdmin


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


class AlerteViewSet(viewsets.ModelViewSet):
    queryset = Alerte.objects.all().select_related('zone')
    serializer_class = AlerteSerializer
    permission_classes = [IsAutoriteOrAdmin]

    def get_queryset(self):
        queryset = self.queryset
        zone = self.request.query_params.get('zone')
        niveau = self.request.query_params.get('niveau')
        if zone:
            queryset = queryset.filter(zone_id=zone)
        if niveau:
            queryset = queryset.filter(niveau=niveau)
        return queryset

    @action(detail=True, methods=['patch'], url_path='statut')
    def statut(self, request, pk=None):
        instance = self.get_object()
        new_statut = request.data.get('statut')

        if not new_statut:
            return Response({"statut": ["Ce champ est obligatoire."]}, status=400)

        allowed_statuts = [choice[0] for choice in Alerte.STATUT_CHOICES]
        if new_statut not in allowed_statuts:
            return Response(
                {"statut": [f"'{new_statut}' n'est pas un statut valide. Choix valides : {', '.join(allowed_statuts)}."]},
                status=400
            )

        current_statut = instance.statut

        if current_statut != new_statut:
            if current_statut == 'en_attente' and new_statut != 'envoyee':
                return Response(
                    {"detail": f"Transition invalide de '{current_statut}' vers '{new_statut}'. La transition doit être 'en_attente' -> 'envoyee'."},
                    status=400
                )
            elif current_statut == 'envoyee' and new_statut != 'resolue':
                return Response(
                    {"detail": f"Transition invalide de '{current_statut}' vers '{new_statut}'. La transition doit être 'envoyee' -> 'resolue'."},
                    status=400
                )
            elif current_statut == 'resolue':
                return Response(
                    {"detail": f"Impossible de modifier le statut d'une alerte déjà résolue ('{current_statut}' -> '{new_statut}')."},
                    status=400
                )

        instance.statut = new_statut
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ZoneRisqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ZoneRisque.objects.all()
    serializer_class = ZoneRisqueGeoSerializer


class PredictionIAViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PredictionIA.objects.all()
    serializer_class = PredictionIASerializer

    def get_queryset(self):
        latest_predictions = PredictionIA.objects.filter(
            zone=OuterRef('zone_id')
        ).order_by('-timestamp')
        
        return PredictionIA.objects.filter(
            id=Subquery(latest_predictions.values('id')[:1])
        ).select_related('zone').order_by('-timestamp')


class EpisodeInondationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EpisodeInondation.objects.all()
    serializer_class = EpisodeInondationSerializer


class SignalementCitoyenViewSet(viewsets.ModelViewSet):
    queryset = SignalementCitoyen.objects.all()
    serializer_class = SignalementCitoyenSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsAutoriteOrAdmin()]

