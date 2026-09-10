from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
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
)

router = DefaultRouter()
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


urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
