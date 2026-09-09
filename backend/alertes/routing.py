from django.urls import path
from alertes.consumers import AlerteConsumer

websocket_urlpatterns = [
    path('ws/alertes/', AlerteConsumer.as_asgi()),
]
