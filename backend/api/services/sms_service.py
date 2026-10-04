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
            url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"

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

def _masquer(numero: str) -> str:
    """+221771234567 → +221*******67 (les journaux ne contiennent jamais le numéro complet)."""
    numero = str(numero or '')
    return numero[:4] + '*' * max(len(numero) - 6, 0) + numero[-2:] if len(numero) > 6 else '***'


# --- Fournisseurs de SMS pour les codes OTP -----------------------------------
# Le fournisseur est choisi par SMS_FOURNISSEUR (settings) : « orange » (API SMS
# Sénégal d'Orange Developer), « twilio », ou vide tant qu'aucun n'est
# opérationnel. Dans ce dernier cas, l'inscription passe par l'email.

ORANGE_TOKEN_URL = 'https://api.orange.com/oauth/v3/token'
ORANGE_SMS_URL = 'https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B{expediteur}/requests'
ORANGE_EXPEDITEUR_SENEGAL = '2210000'   # numéro d'expédition imposé par Orange pour le Sénégal

_jeton_orange = {'valeur': None, 'expire': 0.0}


def fournisseur_sms():
    """Renvoie 'orange', 'twilio' ou None si aucun fournisseur n'est configuré."""
    from django.conf import settings
    fournisseur = (getattr(settings, 'SMS_FOURNISSEUR', '') or '').strip().lower()
    return fournisseur if fournisseur in ('orange', 'twilio') else None


def _obtenir_jeton_orange(forcer=False):
    """Jeton OAuth 2 (client_credentials), valable 1 h et réutilisé jusqu'à 1 min de son expiration."""
    import base64
    import time

    if not forcer and _jeton_orange['valeur'] and time.time() < _jeton_orange['expire'] - 60:
        return _jeton_orange['valeur']
    identifiants = f"{os.environ['ORANGE_CLIENT_ID']}:{os.environ['ORANGE_CLIENT_SECRET']}"
    reponse = requests.post(
        ORANGE_TOKEN_URL,
        headers={
            'Authorization': 'Basic ' + base64.b64encode(identifiants.encode()).decode(),
            'Accept': 'application/json',
        },
        data={'grant_type': 'client_credentials'},
        timeout=10,
    )
    reponse.raise_for_status()
    donnees = reponse.json()
    _jeton_orange['valeur'] = donnees['access_token']
    _jeton_orange['expire'] = time.time() + int(donnees.get('expires_in', 3600))
    return _jeton_orange['valeur']


def _envoyer_sms_orange(numero: str, message: str) -> None:
    """Envoie un SMS par l'API Orange ; lève une exception en cas d'échec."""
    expediteur = os.environ.get('ORANGE_SMS_EXPEDITEUR', ORANGE_EXPEDITEUR_SENEGAL).lstrip('+')
    requete = {
        'address': f'tel:{numero}',
        'senderAddress': f'tel:+{expediteur}',
        'outboundSMSTextMessage': {'message': message},
    }
    # Nom d'expéditeur (11 caractères max.) : uniquement s'il a été validé par Orange
    nom = os.environ.get('ORANGE_SMS_NOM_EXPEDITEUR')
    if nom:
        requete['senderName'] = nom
    url = ORANGE_SMS_URL.format(expediteur=expediteur)

    def poster(jeton):
        return requests.post(
            url,
            json={'outboundSMSMessageRequest': requete},
            headers={'Authorization': f'Bearer {jeton}', 'Accept': 'application/json'},
            timeout=10,
        )

    reponse = poster(_obtenir_jeton_orange())
    if reponse.status_code == 401:      # jeton expiré côté Orange : on en redemande un
        reponse = poster(_obtenir_jeton_orange(forcer=True))
    if reponse.status_code != 201:
        raise RuntimeError(f"Orange a répondu {reponse.status_code} : {reponse.text[:200]}")


def _envoyer_sms_twilio(numero: str, message: str) -> None:
    """Envoie un SMS par Twilio ; lève une exception en cas d'échec.
    En compte d'essai, Twilio n'écrit qu'aux numéros vérifiés et seulement vers
    les pays autorisés (le Sénégal exige un compte payant)."""
    from twilio.rest import Client
    Client(os.environ['TWILIO_ACCOUNT_SID'], os.environ['TWILIO_AUTH_TOKEN']).messages.create(
        body=message, from_=os.environ['TWILIO_PHONE_NUMBER'], to=numero,
    )


def _envoyer_sms(numero: str, message: str, nature: str, apercu: str) -> bool:
    """
    Envoie un SMS par le fournisseur configuré. Renvoie True seulement s'il a
    accepté le message. `nature` (« OTP », « ALERTE ») sert aux journaux ;
    `apercu` est ce que la simulation affiche en développement.

    Sans fournisseur, rien n'est envoyé : en développement (DEBUG) l'envoi est
    simulé dans la console, en production la fonction renvoie False pour que
    l'application ne prétende pas avoir prévenu quelqu'un.
    """
    from django.conf import settings
    from users.otp import normaliser_telephone

    destinataire = normaliser_telephone(numero)
    if destinataire is None:
        logger.warning("[%s SMS] Numéro inexploitable ignoré : %s", nature, _masquer(numero))
        return False

    fournisseur = fournisseur_sms()
    if fournisseur is None:
        if settings.DEBUG:
            logger.warning("[%s SMS SIMULATION] %s : %s", nature, _masquer(destinataire), apercu)
            return True
        logger.error("[%s SMS] Aucun fournisseur SMS configuré : rien envoyé à %s", nature, _masquer(destinataire))
        return False

    envoyer = _envoyer_sms_orange if fournisseur == 'orange' else _envoyer_sms_twilio
    try:
        envoyer(destinataire, message)
    except Exception as e:
        logger.error("[%s SMS] Échec de l'envoi %s à %s : %s", nature, fournisseur, _masquer(destinataire), e)
        return False
    logger.info("[%s SMS] Envoyé par %s à %s", nature, fournisseur, _masquer(destinataire))
    return True


def send_otp_sms(phone_number: str, otp_code: str) -> bool:
    """Envoie un code de vérification par SMS (voir _envoyer_sms)."""
    message = (
        f"MBEUND MI : votre code de vérification est {otp_code}. "
        "Valable 10 minutes. Ne le communiquez à personne."
    )
    return _envoyer_sms(phone_number, message, 'OTP', f'code {otp_code}')


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
            url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"

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
    Envoie un SMS d'alerte inondation à un citoyen inscrit ou à un agent, par
    le même fournisseur que les codes de vérification (voir _envoyer_sms).
    """
    texte = f"[ALERTE MBEUND MI] {message}\nConsignes : Evitez les zones bas de Ndakhane & Thiaroye Gare."
    return _envoyer_sms(phone_number, texte, 'ALERTE', texte)
