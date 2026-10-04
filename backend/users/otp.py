"""
Codes à usage unique (OTP) : génération, stockage, vérification et envoi.

Utilisé pour la vérification du compte à l'inscription et pour la
réinitialisation du mot de passe. L'utilisateur choisit le canal :
- « telephone » : SMS via le fournisseur configuré (SMS_FOURNISSEUR : Orange ou
  Twilio) ; sans fournisseur, ce canal est fermé (sauf simulation en DEBUG) ;
- « email » : email via le serveur SMTP configuré (Gmail en production).
"""
import hmac
import logging
import re
import secrets
import string

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils.html import escape

logger = logging.getLogger(__name__)

CANAL_TELEPHONE = 'telephone'
CANAL_EMAIL = 'email'
CANAUX = (CANAL_TELEPHONE, CANAL_EMAIL)

DUREE_VALIDITE = 600          # 10 minutes
DELAI_RENVOI = 60             # 1 minute entre deux envois au même compte
ESSAIS_MAX = 5                # au-delà, le code est annulé

MOTIF_INSCRIPTION = 'inscription'
MOTIF_REINITIALISATION = 'reinitialisation'

_OBJETS = {
    MOTIF_INSCRIPTION: 'MBEUND MI — votre code de vérification',
    MOTIF_REINITIALISATION: 'MBEUND MI — réinitialisation de votre mot de passe',
}
_PHRASES = {
    MOTIF_INSCRIPTION: 'Voici votre code pour activer votre compte MBEUND MI',
    MOTIF_REINITIALISATION: 'Voici votre code pour choisir un nouveau mot de passe MBEUND MI',
}


# --- Numéros de téléphone ---------------------------------------------------

def normaliser_telephone(valeur):
    """
    Ramène un numéro au format international E.164 attendu par Twilio.
    « 77 123 45 67 », « 00221771234567 » et « +221 77 123 45 67 » donnent
    tous « +221771234567 ». Renvoie None si le numéro est inexploitable.
    """
    if not valeur:
        return None
    brut = re.sub(r'[\s.\-()]', '', str(valeur))
    if brut.startswith('00'):
        brut = '+' + brut[2:]
    if re.fullmatch(r'[37]\d{8}', brut):          # numéro sénégalais local
        brut = '+221' + brut
    if re.fullmatch(r'\+\d{8,15}', brut):
        return brut
    return None


def masquer_telephone(numero):
    """+221771234567 → +221 77 *** ** 67"""
    if not numero or len(numero) < 6:
        return '***'
    if numero.startswith('+221') and len(numero) == 13:
        return f'+221 {numero[4:6]} *** ** {numero[-2:]}'
    return f'{numero[:4]} *** {numero[-2:]}'


def masquer_email(adresse):
    """awa.diop@gmail.com → a*******@gmail.com"""
    if not adresse or '@' not in adresse:
        return '***'
    local, domaine = adresse.split('@', 1)
    return f'{local[0]}{"*" * max(len(local) - 1, 3)}@{domaine}'


# --- Codes ------------------------------------------------------------------

def generer_code():
    return ''.join(secrets.choice(string.digits) for _ in range(6))


def _cle(motif, user):
    return f'otp_{motif}_{user.pk}'


def creer_code(motif, user, canal):
    """Génère et mémorise un code pour ce compte, en remplaçant le précédent."""
    code = generer_code()
    cache.set(_cle(motif, user), {'code': code, 'canal': canal, 'essais': 0}, timeout=DUREE_VALIDITE)
    return code


def sms_disponible():
    """Le canal SMS est ouvert si un fournisseur est configuré (ou, en
    développement, grâce à la simulation dans la console)."""
    from api.services.sms_service import fournisseur_sms
    return fournisseur_sms() is not None or settings.DEBUG


def canal_par_defaut(user):
    """SMS si possible, sinon email ; None si aucun canal n'est utilisable."""
    if sms_disponible():
        return CANAL_TELEPHONE
    return CANAL_EMAIL if user.email else None


def dernier_canal(motif, user):
    entree = cache.get(_cle(motif, user))
    return entree['canal'] if entree else None


def verifier_code(motif, user, code):
    """
    Renvoie 'ok', 'expire' ou 'invalide'. Le code est détruit après succès,
    ou après ESSAIS_MAX tentatives erronées (protection contre l'essai
    systématique des 1 000 000 combinaisons).
    """
    cle = _cle(motif, user)
    entree = cache.get(cle)
    if not entree:
        return 'expire'
    if hmac.compare_digest(str(code).strip(), entree['code']):
        cache.delete(cle)
        return 'ok'
    entree['essais'] += 1
    if entree['essais'] >= ESSAIS_MAX:
        cache.delete(cle)
        return 'expire'
    cache.set(cle, entree, timeout=DUREE_VALIDITE)
    return 'invalide'


def renvoi_trop_rapide(motif, user):
    """True si un code a été envoyé à ce compte il y a moins de DELAI_RENVOI secondes."""
    return not cache.add(f'otp_delai_{motif}_{user.pk}', True, timeout=DELAI_RENVOI)


# --- Envoi ------------------------------------------------------------------

def destination(user, canal):
    if canal == CANAL_EMAIL:
        return masquer_email(user.email)
    return masquer_telephone(user.profile.telephone)


def envoyer_code(user, canal, code, motif):
    """Envoie le code sur le canal choisi. Renvoie True si l'envoi a été accepté."""
    if canal == CANAL_EMAIL:
        return _envoyer_email(user, code, motif)
    from api.services.sms_service import send_otp_sms
    return bool(send_otp_sms(user.profile.telephone, code))


def _envoyer_email(user, code, motif):
    if not user.email:
        return False
    prenom = user.first_name or user.username
    minutes = DUREE_VALIDITE // 60
    texte = (
        f"Bonjour {prenom},\n\n"
        f"{_PHRASES[motif]} : {code}\n\n"
        f"Ce code est valable {minutes} minutes. Ne le communiquez à personne : "
        f"l'équipe MBEUND MI ne vous le demandera jamais.\n\n"
        f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n"
        f"MBEUND MI — Prévention des inondations, Thiaroye-sur-Mer"
    )
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#14232c">'
        '<h2 style="color:#0f5d73;margin-bottom:4px">MBEUND MI</h2>'
        '<p style="margin-top:0;color:#556670">Prévention des inondations · Thiaroye-sur-Mer</p>'
        f'<p>Bonjour {escape(prenom)},</p><p>{_PHRASES[motif]} :</p>'
        f'<p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#e3f0f3;'
        f'padding:16px;text-align:center;border-radius:8px">{code}</p>'
        f'<p>Ce code est valable <b>{minutes} minutes</b>. Ne le communiquez à personne : '
        "l'équipe MBEUND MI ne vous le demandera jamais.</p>"
        '<p style="color:#556670;font-size:13px">Si vous n\'êtes pas à l\'origine de cette demande, '
        'ignorez cet email.</p></div>'
    )
    try:
        send_mail(
            _OBJETS[motif], texte, settings.DEFAULT_FROM_EMAIL, [user.email],
            html_message=html, fail_silently=False,
        )
        return True
    except Exception:
        logger.exception("Échec de l'envoi de l'email OTP à l'utilisateur %s", user.pk)
        return False
