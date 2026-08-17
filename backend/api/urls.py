from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from api.views import CapteurViewSet, MesureViewSet

router = DefaultRouter()
router.register(r'capteurs', CapteurViewSet, basename='capteur')
router.register(r'mesures', MesureViewSet, basename='mesure')

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
