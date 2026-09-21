import os
import sys
from django.conf import settings
from django.db.models import Subquery, OuterRef
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from datetime import timedelta

from rest_framework import permissions, serializers
from capteurs.models import Capteur, Mesure
from alertes.models import (
    Alerte, ZoneRisque, PredictionIA, EpisodeInondation, SignalementCitoyen,
    SegmentRue, PrevisionMeteo, HistoriqueRisque, ContactAlerte,
    ProfilVulnerabilite, RelaisQuartier,
)
from api.serializers import (
    CapteurSerializer,
    MesureSerializer,
    AlerteSerializer,
    ZoneRisqueGeoSerializer,
    PredictionIASerializer,
    EpisodeInondationSerializer,
    SignalementCitoyenSerializer,
    SegmentRueSerializer,
    PrevisionMeteoSerializer,
    HistoriqueRisqueSerializer,
    ContactAlerteSerializer,
    CustomTokenObtainPairSerializer,
    ProfilVulnerabiliteSerializer,
    RelaisQuartierSerializer,
)
from api.permissions import IsAutoriteOrAdmin, EstAdminOuAutorite


class CustomTokenObtainPairView(TokenObtainPairView):
    """Identique à TokenObtainPairView, mais émet un JWT portant le claim `role`."""
    serializer_class = CustomTokenObtainPairSerializer


# mbeund_mi_ia est un module frère de backend/ (pas un paquet pip installé) —
# on l'ajoute au path pour réutiliser le vrai service chatbot de Maïmouna
# (Groq) au lieu de dupliquer sa logique dans Django. Même pattern que
# alertes/tasks.py pour le service de prédiction.
_MBEUND_MI_IA_PATH = os.path.join(os.path.dirname(settings.BASE_DIR), 'mbeund_mi_ia')
if _MBEUND_MI_IA_PATH not in sys.path:
    sys.path.insert(0, _MBEUND_MI_IA_PATH)

_chatbot_service = None


def _get_chatbot_service():
    """Charge le service NDAM (client Groq) une seule fois par worker."""
    global _chatbot_service
    if _chatbot_service is None:
        from ia.service_chatbot import MbeundMiChatbot
        _chatbot_service = MbeundMiChatbot()
    return _chatbot_service


class ChatView(APIView):
    """
    POST /api/chat/ — relaie une question à l'assistant NDAM.

    Django rassemble ici le contexte (risque, météo, signalements validés)
    sous forme de simples chaînes de caractères avant d'appeler le service
    chatbot : NDAM lui-même ne reçoit jamais un accès direct à la base de
    données, conformément à la contrainte du projet (éviter fuites de
    données et hallucinations).
    """
    permission_classes = [permissions.IsAuthenticated]

    _RISQUE_LABELS = {
        'vert': 'FAIBLE',
        'jaune': 'MODÉRÉ',
        'orange': 'ÉLEVÉ',
        'rouge': 'CRITIQUE',
    }

    def post(self, request):
        question = (request.data.get('question') or '').strip()
        if not question:
            return Response({"question": ["Ce champ est obligatoire."]}, status=400)

        zone_risque = ZoneRisque.objects.order_by('-score_risque_moyen').first()
        niveau_risque = self._RISQUE_LABELS.get(
            getattr(zone_risque, 'niveau_risque', None), 'FAIBLE'
        )

        prevision = PrevisionMeteo.objects.order_by('-date_prevision').first()
        if prevision:
            meteo_context = (
                f"Température {prevision.temperature}°C, "
                f"précipitations {prevision.precipitation} mm, "
                f"vent {prevision.vitesse_vent} km/h"
            )
        else:
            meteo_context = "Non disponible"

        signalements = SignalementCitoyen.objects.filter(valide=True).order_by('-date_creation')[:3]
        descriptions = [s.description[:120] for s in signalements if s.description]
        signalements_context = " ; ".join(descriptions) if descriptions else "Aucun récent"

        chatbot = _get_chatbot_service()
        reply = chatbot.poser_question(
            question,
            meteo_context=meteo_context,
            signalements_context=signalements_context,
            niveau_risque=niveau_risque,
        )
        return Response({"reply": reply})


class CapteurViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Capteur. Exposes standard GET/POST/PUT/DELETE.
    """
    queryset = Capteur.objects.all()
    serializer_class = CapteurSerializer
    permission_classes = [IsAutoriteOrAdmin]


class MesureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Mesure. Exposes standard GET/POST/PUT/DELETE,
    and a custom action `/api/mesures/recentes/`.
    """
    queryset = Mesure.objects.all()
    serializer_class = MesureSerializer
    permission_classes = [IsAutoriteOrAdmin]
    pagination_class = PageNumberPagination

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
    pagination_class = PageNumberPagination

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
    permission_classes = [IsAutoriteOrAdmin]

    def get_queryset(self):
        latest_predictions = PredictionIA.objects.filter(
            zone=OuterRef('zone_id')
        ).order_by('-timestamp')

        return PredictionIA.objects.filter(
            id=Subquery(latest_predictions.values('id')[:1])
        ).select_related('zone').order_by('-timestamp')

    @action(detail=False, methods=['get'], url_path='fiabilite')
    def fiabilite(self, request):
        """
        GET /api/predictions/fiabilite/
        Retourne les métriques de fiabilité du modèle Random Forest : Brier Score,
        Log Loss, Accuracy, matrice de confusion, courbe de calibration.
        """
        from api.services.model_reliability_service import ModelReliabilityService
        try:
            service = ModelReliabilityService()
            rapport = service.generer_rapport()
            return Response(rapport)
        except Exception as e:
            return Response({"erreur": str(e)}, status=500)


class EpisodeInondationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EpisodeInondation.objects.all()
    serializer_class = EpisodeInondationSerializer

    @action(detail=False, methods=['get'], url_path='backtesting')
    def backtesting(self, request):
        """
        GET /api/inondations/backtesting/
        Exécute le backtesting : pour chaque inondation historique, calcule
        ce que le modèle aurait prédit (basé sur les pluies 72h avant).
        Retourne les résultats avec statistiques de détection.
        """
        from api.services.backtesting_service import BacktestingService
        try:
            service = BacktestingService()
            resultat = service.executer_backtesting()
            return Response(resultat)
        except Exception as e:
            return Response({"erreur": str(e)}, status=500)


class SignalementCitoyenViewSet(viewsets.ModelViewSet):
    queryset = SignalementCitoyen.objects.all()
    serializer_class = SignalementCitoyenSerializer
    pagination_class = PageNumberPagination

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsAutoriteOrAdmin()]

    @action(detail=True, methods=['patch'], url_path='valider')
    def valider(self, request, pk=None):
        """
        PATCH /api/signalements/{id}/valider/  body: {"valide": true|false}
        `valide` est en lecture seule sur le serializer (pour empêcher un
        citoyen de l'auto-valider à la création) ; cette action dédiée est
        le seul moyen pour une autorité/admin de le faire basculer.
        """
        instance = self.get_object()
        valide = request.data.get('valide')

        if valide is None:
            return Response({"valide": ["Ce champ est obligatoire."]}, status=400)
        if not isinstance(valide, bool):
            return Response({"valide": ["Ce champ doit être un booléen (true ou false)."]}, status=400)

        instance.valide = valide
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class SegmentRueViewSet(viewsets.ModelViewSet):
    queryset = SegmentRue.objects.all()
    serializer_class = SegmentRueSerializer
    permission_classes = [IsAutoriteOrAdmin]


class PrevisionMeteoViewSet(viewsets.ModelViewSet):
    queryset = PrevisionMeteo.objects.all()
    serializer_class = PrevisionMeteoSerializer
    permission_classes = [IsAutoriteOrAdmin]
    pagination_class = PageNumberPagination


class HistoriqueRisqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistoriqueRisque.objects.all()
    serializer_class = HistoriqueRisqueSerializer
    pagination_class = PageNumberPagination


class ContactAlerteViewSet(viewsets.ModelViewSet):
    """
    Registre des citoyens souhaitant recevoir un SMS d'alerte dans leur zone.
    Inscription libre (comme pour les signalements) ; consultation/gestion
    réservées aux autorités/admin car ce sont des numéros de téléphone (PII).
    """
    queryset = ContactAlerte.objects.all()
    serializer_class = ContactAlerteSerializer
    pagination_class = PageNumberPagination

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [EstAdminOuAutorite()]


class ItineraireSecuriseView(APIView):
    """
    GET /api/itineraire-securise/?lat=..&lon=..

    Calcule, à partir des SegmentRue enregistrés, un itinéraire à pied
    évitant autant que possible les tronçons à risque élevé jusqu'à la
    zone à faible risque la plus proche du réseau connu (voir
    api/services/routing_service.py — Dijkstra pondéré par le risque).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat'))
            lon = float(request.query_params.get('lon'))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Paramètres 'lat' et 'lon' requis (nombres décimaux)."},
                status=400,
            )

        from api.services.routing_service import find_safe_route
        result = find_safe_route(lat, lon)
        if result is None:
            return Response(
                {"detail": "Aucun itinéraire disponible pour l’instant depuis cette position."},
                status=404,
            )
        return Response(result)


class MonProfilVulnerabiliteView(APIView):
    """
    GET/PUT /api/mon-profil-vulnerabilite/ — un citoyen connecté consulte ou
    déclare/modifie le profil de vulnérabilité de son propre foyer (créé à la
    première sauvegarde). Jamais consultable par un autre citoyen : côté
    autorité, voir ProfilVulnerabiliteViewSet.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profil = ProfilVulnerabilite.objects.filter(user=request.user).first()
        if profil is None:
            return Response(None)
        return Response(ProfilVulnerabiliteSerializer(profil).data)

    def put(self, request):
        profil, _ = ProfilVulnerabilite.objects.get_or_create(user=request.user)
        serializer = ProfilVulnerabiliteSerializer(profil, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProfilVulnerabiliteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Consultation par une autorité/admin des profils de vulnérabilité déclarés
    par les citoyens, pour prioriser l'assistance à l'évacuation. Un citoyen
    déclare le sien via MonProfilVulnerabiliteView, jamais via ce ViewSet.
    """
    queryset = ProfilVulnerabilite.objects.select_related('user', 'zone').all()
    serializer_class = ProfilVulnerabiliteSerializer
    permission_classes = [EstAdminOuAutorite]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        queryset = self.queryset
        zone = self.request.query_params.get('zone')
        if zone:
            queryset = queryset.filter(zone_id=zone)
        return queryset


class RelaisQuartierViewSet(viewsets.ModelViewSet):
    """
    Citoyens volontaires pour relayer une alerte et aider à l'évacuation dans
    leur zone. Chaque citoyen ne gère que sa propre inscription (OneToOne) ;
    la liste complète et la vérification (`verifier`) sont réservées à
    l'autorité/admin.
    """
    queryset = RelaisQuartier.objects.select_related('user', 'zone').all()
    serializer_class = RelaisQuartierSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_permissions(self):
        if self.action in ('list', 'verifier'):
            return [EstAdminOuAutorite()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.action in ('list', 'verifier'):
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        if RelaisQuartier.objects.filter(user=self.request.user).exists():
            raise serializers.ValidationError(
                {"detail": "Vous êtes déjà inscrit comme relais de quartier."}
            )
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='moi')
    def moi(self, request):
        """GET /api/relais-quartier/moi/ — retrouve sa propre inscription (ou null)."""
        instance = RelaisQuartier.objects.filter(user=request.user).select_related('zone').first()
        if instance is None:
            return Response(None)
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['patch'], url_path='verifier')
    def verifier(self, request, pk=None):
        """
        PATCH /api/relais-quartier/{id}/verifier/  body: {"verifie": true|false}
        `verifie` est en lecture seule sur le serializer (empêche un citoyen
        de s'auto-vérifier) ; seule une autorité/admin peut le faire basculer.
        """
        instance = self.get_object()
        verifie = request.data.get('verifie')

        if verifie is None:
            return Response({"verifie": ["Ce champ est obligatoire."]}, status=400)
        if not isinstance(verifie, bool):
            return Response({"verifie": ["Ce champ doit être un booléen (true ou false)."]}, status=400)

        instance.verifie = verifie
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)
