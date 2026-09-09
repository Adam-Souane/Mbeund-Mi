from firebase_admin import messaging
import logging

def envoyer_notification_push(titre, corps, topic="thiaroye_alertes"):
    """
    Envoie une notification push via Firebase Cloud Messaging à tous les abonnés du topic.
    """
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=titre,
                body=corps,
            ),
            topic=topic,
        )
        # Envoi effectif
        response = messaging.send(message)
        logging.info(f"[SUCCES] Notification Push Firebase envoyée avec succès! ID: {response}")
        return True
    except Exception as e:
        logging.error(f"[ERREUR] Échec de l'envoi de la notification Firebase: {e}")
        return False
