import json
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class AlerteConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Authentification par JWT : le frontend n'utilise pas de cookie de
        # session Django (AuthMiddlewareStack ne peuple donc jamais
        # scope["user"] pour ce client), le token d'acces est transmis en
        # query string (ws/alertes/?token=<access>) et verifie ici a la
        # main. Meme niveau d'exigence que GET /api/alertes/
        # (IsAutoriteOrAdmin : lecture ouverte a tout utilisateur
        # authentifie, ecriture reservee autorite/admin) : on rejette les
        # connexions anonymes plutot que de diffuser les alertes a tout le
        # monde sans controle.
        token = parse_qs(self.scope["query_string"].decode()).get("token", [None])[0]
        if not token or not self._token_valide(token):
            await self.close(code=4401)
            return

        self.group_name = "alertes"

        # Join the "alertes" group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

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

    async def disconnect(self, close_code):
        # Leave the "alertes" group (uniquement si on l'avait bien rejoint :
        # une connexion rejetee dans connect() n'a pas de group_name)
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # We don't expect messages from the client in this design,
        # but we handle any text message gracefully
        pass

    async def send_alerte(self, event):
        # Send data received from the group directly to the client
        data = event.get("data", {})
        await self.send(text_data=json.dumps(data))
