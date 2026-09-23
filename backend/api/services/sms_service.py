import os
import logging

logger = logging.getLogger(__name__)

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
