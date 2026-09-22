from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import UserViewSet
from api.views import (
    CapteurViewSet,
    MesureViewSet,
    AlerteViewSet,
    ZoneRisqueViewSet,
    PredictionIAViewSet,
    EpisodeInondationViewSet,
    SignalementCitoyenViewSet,
    SegmentRueViewSet,
    PrevisionMeteoViewSet,
    HistoriqueRisqueViewSet,
    ContactAlerteViewSet,
    CustomTokenObtainPairView,
    ChatView,
    ItineraireSecuriseView,
    MonProfilVulnerabiliteView,
    ProfilVulnerabiliteViewSet,
    RelaisQuartierViewSet,
    PointRefugeViewSet,
    SMSSignalementViewSet,
    SMSInboundWebhookView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'capteurs', CapteurViewSet, basename='capteur')
router.register(r'mesures', MesureViewSet, basename='mesure')
router.register(r'alertes', AlerteViewSet, basename='alerte')
router.register(r'zones', ZoneRisqueViewSet, basename='zone')
router.register(r'segments', SegmentRueViewSet, basename='segment')
router.register(r'predictions', PredictionIAViewSet, basename='prediction')
router.register(r'previsions', PrevisionMeteoViewSet, basename='prevision')
router.register(r'inondations', EpisodeInondationViewSet, basename='inondation')
router.register(r'historique-risque', HistoriqueRisqueViewSet, basename='historique-risque')
router.register(r'signalements', SignalementCitoyenViewSet, basename='signalement')
router.register(r'contacts-alerte', ContactAlerteViewSet, basename='contact-alerte')
router.register(r'profils-vulnerabilite', ProfilVulnerabiliteViewSet, basename='profil-vulnerabilite')
router.register(r'relais-quartier', RelaisQuartierViewSet, basename='relais-quartier')
router.register(r'refuges', PointRefugeViewSet, basename='refuge')
router.register(r'sms-signalements', SMSSignalementViewSet, basename='sms-signalement')


urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('chat/', ChatView.as_view(), name='chat'),
    path('itineraire-securise/', ItineraireSecuriseView.as_view(), name='itineraire-securise'),
    path('mon-profil-vulnerabilite/', MonProfilVulnerabiliteView.as_view(), name='mon-profil-vulnerabilite'),
    path('sms/inbound/', SMSInboundWebhookView.as_view(), name='sms-inbound-webhook'),
    path('', include(router.urls)),
]
