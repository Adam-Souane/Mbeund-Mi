import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger(__name__)

# Le navigateur ne permet pas d'en-tête Authorization sur un WebSocket. Le
# jeton d'accès voyage donc dans Sec-WebSocket-Protocol, sous la forme
# ['mbeund.jwt', '<jeton>'] (un sous-protocole ne peut pas contenir d'espace :
# « Bearer <jeton> » est refusé par les navigateurs). Jamais dans l'URL, qui
# finit dans l'historique et les journaux des serveurs.
SOUS_PROTOCOLE_JWT = 'mbeund.jwt'


def jeton_du_sous_protocole(sous_protocoles):
    """Renvoie le jeton qui suit 'mbeund.jwt' dans la liste, ou None."""
    sous_protocoles = list(sous_protocoles or [])
    if SOUS_PROTOCOLE_JWT not in sous_protocoles:
        return None
    position = sous_protocoles.index(SOUS_PROTOCOLE_JWT) + 1
    return sous_protocoles[position] if position < len(sous_protocoles) else None


class AlerteConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer pour les notifications temps réel.
    Gère les alertes, signalements, SMS et autres notifications.
    """

    async def connect(self):
        try:
            token = jeton_du_sous_protocole(self.scope.get("subprotocols"))
            if not token or not self._token_valide(token):
                await self.close(code=4401)
                return

            # Récupérer l'utilisateur et sa zone (pour les citoyens)
            user = await self.get_user_from_token(token)
            zone_id = await self.get_user_zone(user) if user else None

            # Déterminer les groupes pour cet utilisateur
            self.groups = ["alertes"]  # Tous reçoivent les alertes

            # Si citoyen : ajouter au groupe de la zone
            if zone_id:
                self.groups.append(f"zone_alerts_{zone_id}")

            # Si autorité : ajouter au groupe des autorites
            is_autorite = await self.check_is_autorite(user)
            if is_autorite:
                self.groups.append("autorite_notifications")

            # Rejoindre tous les groupes
            if self.channel_layer:
                for group_name in self.groups:
                    await self.channel_layer.group_add(group_name, self.channel_name)

            # Le navigateur exige que le serveur confirme le sous-protocole choisi.
            await self.accept(subprotocol=SOUS_PROTOCOLE_JWT)
            logger.info(f"Client connecté aux groupes: {self.groups}")
        except Exception as e:
            logger.error(f"Erreur dans WebSocket connect: {e}", exc_info=True)
            await self.close(code=1011)

    @staticmethod
    def _token_valide(token):
        # AccessToken() verifie uniquement signature + expiration (aucun
        # acces DB pour un access token SimpleJWT) : suffisant ici, on ne
        # fait pas de distinction de role, comme GET /api/alertes/.
        try:
            AccessToken(token)
            return True
        except TokenError:
            return False

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Récupère l'utilisateur depuis le token JWT."""
        try:
            from django.contrib.auth.models import User
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except:
            return None

    @database_sync_to_async
    def check_is_autorite(self, user):
        """Vérifie que l'utilisateur est autorité."""
        if user and hasattr(user, 'profile'):
            return user.profile.role in ['autorite', 'admin', 'agent']
        return False

    @database_sync_to_async
    def get_user_zone(self, user):
        """Récupère la zone de résidence du citoyen."""
        if user and hasattr(user, 'profilvulnerabilite'):
            try:
                zone = user.profilvulnerabilite.zone
                return zone.id if zone else None
            except:
                pass
        return None

    async def disconnect(self, close_code):
        # Leave all groups
        if hasattr(self, 'groups'):
            for group_name in self.groups:
                await self.channel_layer.group_discard(group_name, self.channel_name)
        logger.info(f"Client déconnecté: code {close_code}")

    async def receive(self, text_data):
        # Handle heartbeat/ping messages
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
                }))
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    # Message handlers for different notification types
    async def send_alerte(self, event):
        """Envoie une notification d'alerte."""
        data = event.get("data", {})
        await self.send(text_data=json.dumps({
            'type': 'alerte',
            'data': data,
            'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
        }))

    async def send_signalement(self, event):
        """Envoie une notification de signalement."""
        data = event.get("data", {})
        await self.send(text_data=json.dumps({
            'type': 'signalement',
            'data': data,
            'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
        }))

    async def send_sms(self, event):
        """Envoie une notification SMS reçu."""
        data = event.get("data", {})
        await self.send(text_data=json.dumps({
            'type': 'sms',
            'data': data,
            'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
        }))

    async def send_prediction(self, event):
        """Envoie une notification de prédiction."""
        data = event.get("data", {})
        await self.send(text_data=json.dumps({
            'type': 'prediction',
            'data': data,
            'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
        }))
