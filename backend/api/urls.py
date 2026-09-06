from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UtilisateurViewSet, ZonePiloteViewSet, SegmentRueViewSet,
    ObservationTerrainViewSet, CapteurIoTViewSet, PrevisionMeteoViewSet,
    AlerteViewSet, HistoriqueRisqueViewSet
)

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'zones', ZonePiloteViewSet)
router.register(r'segments', SegmentRueViewSet)
router.register(r'observations', ObservationTerrainViewSet)
router.register(r'capteurs', CapteurIoTViewSet)
router.register(r'previsions', PrevisionMeteoViewSet)
router.register(r'alertes', AlerteViewSet)
router.register(r'historique-risque', HistoriqueRisqueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
