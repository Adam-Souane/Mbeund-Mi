import json
from channels.generic.websocket import AsyncWebsocketConsumer

class AlerteConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "alertes"

        # Join the "alertes" group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the "alertes" group
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
