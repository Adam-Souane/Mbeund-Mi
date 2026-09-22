"""
WebSocket consumers pour les notifications temps réel.
Gère les connexions WebSocket pour autorités et citoyens.
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket pour les notifications autorité.
    Connecte les autorités à un groupe de notifications.
    """

    async def connect(self):
        """Accepte la connexion WebSocket et ajoute au groupe."""
        # Vérifier que l'utilisateur est authentifié et est autorité
        user = self.scope.get('user')

        if not user or not user.is_authenticated:
            await self.close()
            return

        # Vérifier le rôle (autorité)
        is_autorite = await self.check_is_autorite(user)
        if not is_autorite:
            await self.close()
            return

        # Ajouter à group autorite_notifications
        await self.channel_layer.group_add('autorite_notifications', self.channel_name)
        await self.accept()

        logger.info(f"Autorité connectée: {user.username}")

    async def disconnect(self, close_code):
        """Nettoie la déconnexion."""
        await self.channel_layer.group_discard('autorite_notifications', self.channel_name)
        logger.info(f"Autorité déconnectée: code {close_code}")

    async def receive(self, text_data):
        """Reçoit des messages du client (heartbeat, etc.)."""
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'ping':
                # Répondre au heartbeat
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': str(__import__('django.utils.timezone', fromlist=['now']).now()),
                }))
        except Exception as e:
            logger.error(f"Erreur traitement message: {e}")

    async def notification_message(self, event):
        """
        Traite les notifications reçues du groupe.
        Appelé par channel_layer.group_send()
        """
        notification = event['notification']

        # Envoyer au client WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification,
        }))

    @database_sync_to_async
    def check_is_autorite(self, user):
        """Vérifie que l'utilisateur est autorité."""
        if hasattr(user, 'profile'):
            return user.profile.role in ['autorite', 'admin', 'agent']
        return False


class CitoyenNotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket pour les notifications citoyen.
    Connecte les citoyens à leur groupe de zone.
    """

    async def connect(self):
        """Accepte la connexion WebSocket."""
        user = self.scope.get('user')

        if not user or not user.is_authenticated:
            await self.close()
            return

        # Récupérer la zone du citoyen
        zone_id = await self.get_user_zone(user)

        if zone_id:
            # Ajouter à group spécifique de la zone
            group_name = f'zone_notifications_{zone_id}'
            self.zone_id = zone_id
            self.group_name = group_name
        else:
            # Ajouter au groupe général des citoyens
            self.group_name = 'citoyen_notifications'
            self.zone_id = None

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.info(f"Citoyen connecté: {user.username} (zone: {self.zone_id or 'général'})")

    async def disconnect(self, close_code):
        """Nettoie la déconnexion."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"Citoyen déconnecté: code {close_code}")

    async def receive(self, text_data):
        """Reçoit des messages du client (heartbeat, etc.)."""
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': str(__import__('django.utils.timezone', fromlist=['now']).now()),
                }))
        except Exception as e:
            logger.error(f"Erreur traitement message citoyen: {e}")

    async def notification_message(self, event):
        """Traite les notifications reçues du groupe."""
        notification = event['notification']

        # Envoyer au client
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification,
        }))

    @database_sync_to_async
    def get_user_zone(self, user):
        """Récupère la zone de résidence du citoyen."""
        try:
            if hasattr(user, 'profilvulnerabilite'):
                zone = user.profilvulnerabilite.zone
                return zone.id if zone else None
        except:
            pass
        return None
