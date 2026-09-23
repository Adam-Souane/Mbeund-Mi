import os
import logging
import requests

logger = logging.getLogger(__name__)

def send_otp_whatsapp(phone_number: str, otp_code: str) -> bool:
    """
    Envoie un code OTP par WhatsApp via Meta WhatsApp Business API.
    Fallback sur SMS si WhatsApp échoue.

    Configuration requise dans .env:
    - WHATSAPP_PHONE_NUMBER_ID: numéro WhatsApp Business (ex: 1206XXX)
    - WHATSAPP_ACCESS_TOKEN: token Meta (https://developers.facebook.com)
    """
    phone_id = os.environ.get('WHATSAPP_PHONE_NUMBER_ID')
    access_token = os.environ.get('WHATSAPP_ACCESS_TOKEN')

    # Format: +221779986828 → 221779986828 (WhatsApp format)
    whatsapp_number = phone_number.lstrip('+') if phone_number.startswith('+') else phone_number

    if phone_id and access_token:
        try:
            url = f"https://graph.instagram.com/v18.0/{phone_id}/messages"

            # Format du message avec template WhatsApp
            message_text = f"[MBEUND-MI]\nVotre code OTP: {otp_code}\nValide 10 minutes."

            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": whatsapp_number,
                "type": "text",
                "text": {
                    "preview_url": False,
                    "body": message_text
                }
            }

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            response = requests.post(url, json=payload, headers=headers, timeout=10)

            if response.status_code in [200, 201]:
                msg_id = response.json().get('messages', [{}])[0].get('id', 'unknown')
                logger.info(f"[OTP WhatsApp] Code OTP envoyé avec succès à {phone_number} (ID: {msg_id})")
                return True
            else:
                logger.warning(
                    f"[OTP WhatsApp] Échec Meta API ({response.status_code}): {response.text}. "
                    f"Fallback sur SMS..."
                )
                return send_otp_sms(phone_number, otp_code)

        except Exception as e:
            logger.warning(f"[OTP WhatsApp] Erreur ({e}). Fallback sur SMS...")
            return send_otp_sms(phone_number, otp_code)

    # Mode simulateur si pas configuré
    logger.info(f"[OTP WhatsApp SIMULATION] Destinataire: {phone_number}, Code: {otp_code}")
    return True

def send_otp_sms(phone_number: str, otp_code: str) -> bool:
    """
    Envoie un code OTP par SMS pour l'authentification.
    Utilise Twilio ou mode simulateur avec journalisation.
    """
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_PHONE_NUMBER', '+1234567890')

    formatted_message = f"[MBEUND-MI] Votre code OTP: {otp_code}. Valide 10 minutes."

    if account_sid and auth_token:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            msg = client.messages.create(
                body=formatted_message,
                from_=from_number,
                to=phone_number
            )
            logger.info(f"[OTP SMS] Code OTP envoyé avec succès à {phone_number} (SID: {msg.sid})")
            return True
        except Exception as e:
            logger.warning(f"[OTP SMS] Échec d'envoi via Twilio ({e}). Passage en mode simulateur...")

    logger.info(f"[OTP SMS SIMULATION] Destinataire: {phone_number}, Code: {otp_code}")
    return True

def send_alert_whatsapp(phone_number: str, message: str) -> bool:
    """
    Envoie une alerte d'inondation par WhatsApp via Meta WhatsApp Business API.
    Fallback sur SMS si WhatsApp échoue.
    """
    phone_id = os.environ.get('WHATSAPP_PHONE_NUMBER_ID')
    access_token = os.environ.get('WHATSAPP_ACCESS_TOKEN')

    whatsapp_number = phone_number.lstrip('+') if phone_number.startswith('+') else phone_number

    if phone_id and access_token:
        try:
            url = f"https://graph.instagram.com/v18.0/{phone_id}/messages"

            formatted_message = (
                f"🚨 ALERTE MBEUND-MI 🚨\n\n{message}\n\n"
                f"⚠️ Consignes: Évitez les zones basses de Ndakhane & Thiaroye Gare."
            )

            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": whatsapp_number,
                "type": "text",
                "text": {
                    "preview_url": False,
                    "body": formatted_message
                }
            }

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            response = requests.post(url, json=payload, headers=headers, timeout=10)

            if response.status_code in [200, 201]:
                logger.info(f"[ALERTE WhatsApp] Alerte envoyée avec succès à {phone_number}")
                return True
            else:
                logger.warning(f"[ALERTE WhatsApp] Échec ({response.status_code}). Fallback SMS...")
                return send_alert_sms(phone_number, message)

        except Exception as e:
            logger.warning(f"[ALERTE WhatsApp] Erreur ({e}). Fallback SMS...")
            return send_alert_sms(phone_number, message)

    logger.info(f"[ALERTE WhatsApp SIMULATION] Destinataire: {phone_number}")
    return True

def send_alert_sms(phone_number: str, message: str) -> bool:
    """
    Envoie un SMS d'alerte d'urgence d'inondation à un citoyen ou un agent sur le terrain.
    Prend en charge la passerelle SMS Twilio / Infobip ou le mode simulateur avec journalisation.
    """
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_PHONE_NUMBER', '+1234567890')

    print("=" * 65)
    print("MBEUND-MI - PASSERELLE D'ALERTE SMS D'URGENCE")
    print("=" * 65)

    formatted_message = f"[ALERTE MBEUND-MI] {message}\nConsignes : Evitez les zones bas de Ndakhane & Thiaroye Gare."

    if account_sid and auth_token:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            msg = client.messages.create(
                body=formatted_message,
                from_=from_number,
                to=phone_number
            )
            print(f"[SUCCESS] SMS d'urgence transmis avec succès via Twilio à {phone_number} (SID: {msg.sid})")
            print("=" * 65)
            return True
        except Exception as e:
            print(f"[WARN] Échec d'envoi via Twilio ({e}). Passage en mode simulateur...")

    # Mode Simulateur SMS avec Journalisation Professionnelle
    print(f"[SIMULATION SMS] Destinataire: {phone_number}")
    print(f"[CONTENU SMS] : {formatted_message}")
    print("STATUS: Transmis avec succès (Mode Simulation PFE)")
    print("=" * 65)
    return True

if __name__ == '__main__':
    send_alert_sms('+221770000002', 'Risque fort d\'inondation (8.5/10) détecté à Ndakhane suite à l\'orage.')
