import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from alertes.models import Alerte

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Alerte)
def broadcast_alerte(sender, instance, created, **kwargs):
    if created:
        try:
            from api.serializers import AlerteSerializer
            
            # Serialize the new alert
            serializer = AlerteSerializer(instance)
            data = serializer.data
            
            # Get the channel layer
            channel_layer = get_channel_layer()
            if channel_layer is not None:
                # Send to "alertes" group
                async_to_sync(channel_layer.group_send)(
                    "alertes",
                    {
                        "type": "send_alerte",
                        "data": data
                    }
                )
                logger.info(f"Broadcasted new Alerte (ID: {instance.id}) to WebSockets alertes group. Payload: {data}")
            else:
                logger.warning("Channel layer is not configured. Failed to broadcast Alerte.")
        except Exception as e:
            logger.error(f"Error broadcasting new Alerte (ID: {instance.id}): {e}", exc_info=True)
