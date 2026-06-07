from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ZoneViewSet, MesureViewSet, AlerteViewSet, SignalementViewSet

router = DefaultRouter()
router.register(r'zones', ZoneViewSet)
router.register(r'mesures', MesureViewSet)
router.register(r'alertes', AlerteViewSet)
router.register(r'signalements', SignalementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
