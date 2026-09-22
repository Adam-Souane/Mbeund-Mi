"""
Routing WebSocket pour Django Channels.
Configure les routes WebSocket pour les consumers de notification.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/autorite/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/notifications/citoyen/$', consumers.CitoyenNotificationConsumer.as_asgi()),
]
