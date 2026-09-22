"""
Service pour traiter les SMS entrants (signalements de citoyens) via webhooks Twilio/Infobip.
Crée automatiquement un SignalementCitoyen à partir du SMS.
"""
import logging
import re
from typing import Optional, Tuple
from django.utils import timezone
from django.contrib.gis.geos import Point
from alertes.models import SMSSignalement, SignalementCitoyen, ZoneRisque

logger = logging.getLogger(__name__)

# Centre et rayon de Thiaroye pour validation
THIAROYE_CENTER = (14.75, -17.38)  # (lat, lon)
THIAROYE_RADIUS_KM = 4.0


class SMSInboundService:
    """Traite les SMS entrants et crée des signalements."""

    @staticmethod
    def traiter_sms_twilio(phone_number: str, message_text: str, provider_id: str = None) -> Optional[SMSSignalement]:
        """
        Traite un SMS reçu via Twilio et crée un signalement citoyen.

        Args:
            phone_number: Numéro du citoyen (format Twilio: +221...)
            message_text: Contenu du SMS
            provider_id: Message SID de Twilio (optionnel)

        Returns:
            SMSSignalement créé et traité
        """
        try:
            # 1. Créer l'enregistrement SMSSignalement
            sms_sig = SMSSignalement.objects.create(
                telephone=phone_number,
                contenu_sms=message_text,
                provider_name='twilio',
                provider_id=provider_id or '',
                statut='traitement',
            )
            logger.info(f"SMS reçu de {phone_number}: {message_text[:50]}...")

            # 2. Extraire la localisation du SMS
            localisation_texte, lat, lon = SMSInboundService._extraire_localisation(message_text)
            sms_sig.localisation_texte = localisation_texte

            # 3. Si coordonnées trouvées, créer Point géométrique
            if lat is not None and lon is not None:
                sms_sig.localisation_geom = Point(lon, lat, srid=4326)

            # 4. Créer le SignalementCitoyen
            try:
                signalement = SMSInboundService._creer_signalement_citoyen(
                    phone_number, message_text, lat, lon
                )
                sms_sig.signalement_cree = signalement
                sms_sig.statut = 'converti'
                logger.info(f"SignalementCitoyen #{signalement.id} créé à partir du SMS")
            except Exception as e:
                sms_sig.statut = 'erreur'
                sms_sig.message_erreur = str(e)
                logger.error(f"Erreur création signalement SMS: {e}")

            sms_sig.timestamp_traite = timezone.now()
            sms_sig.save()

            return sms_sig

        except Exception as e:
            logger.error(f"Erreur traitement SMS de {phone_number}: {e}")
            return None

    @staticmethod
    def _extraire_localisation(texte: str) -> Tuple[str, Optional[float], Optional[float]]:
        """
        Extrait une localisation du texte SMS (lieu nommé ou coordonnées).
        Retourne (texte_localisation, lat, lon) où lat/lon peuvent être None.

        Exemples de formats supportés :
        - "Inondation à Thiaroye Gare"
        - "Eau à Ndakhane, près de la mosque"
        - "14.75, -17.38" ou "14.75,-17.38"
        """
        localisation_dict = {
            # Quartiers de Thiaroye avec coordonnées approximatives
            'thiaroye gare': (14.7575, -17.3789),
            'thiaroye centre': (14.7597, -17.3779),
            'thiaroye nord': (14.764, -17.375),
            'thiaroye ouest': (14.758, -17.385),
            'thiaroye est': (14.76, -17.37),
            'ndakhane': (14.765, -17.385),
            'malika': (14.73, -17.4),
        }

        # 1. Chercher les coordonnées en format "lat, lon"
        coord_match = re.search(r'(\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)', texte)
        if coord_match:
            try:
                lat = float(coord_match.group(1))
                lon = float(coord_match.group(2))
                if SMSInboundService._est_a_thiaroye(lat, lon):
                    return texte, lat, lon
            except ValueError:
                pass

        # 2. Chercher les noms de quartiers
        texte_lower = texte.lower()
        for quartier, (lat, lon) in localisation_dict.items():
            if quartier in texte_lower:
                return f"Thiaroye - {quartier.title()}", lat, lon

        # 3. Retourner le texte original sans coordonnées
        # (sera traité manuellement par l'autorité)
        return texte[:100], None, None

    @staticmethod
    def _est_a_thiaroye(lat: float, lon: float) -> bool:
        """Vérifie si les coordonnées sont dans le rayon de Thiaroye."""
        from math import radians, sin, cos, sqrt, atan2

        lat1, lon1 = THIAROYE_CENTER
        lat2, lon2 = lat, lon

        R = 6371  # Rayon terrestre en km
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)

        a = (sin(dlat/2)**2 +
             cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2)
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c

        return distance <= THIAROYE_RADIUS_KM

    @staticmethod
    def _creer_signalement_citoyen(
        phone_number: str,
        message_text: str,
        lat: Optional[float],
        lon: Optional[float]
    ) -> SignalementCitoyen:
        """
        Crée un SignalementCitoyen à partir des données du SMS.
        Le citoyen n'est pas connecté donc signale_par reste null.
        """
        # Si pas de localisation, utiliser le centre de Thiaroye
        if lat is None or lon is None:
            lat, lon = THIAROYE_CENTER

        signalement = SignalementCitoyen.objects.create(
            localisation=f"POINT({lon} {lat})",
            description=f"[SMS de {phone_number}] {message_text}",
            categorie='inondation',
            valide=False,  # Nécessite validation par autorité
            signale_par=None,  # Citoyen non connecté
        )

        return signalement


def traiter_webhook_sms(phone_number: str, message_text: str, provider: str = 'twilio', provider_id: str = None):
    """
    Fonction utilitaire pour traiter un webhook SMS entrant.
    Appelée par l'endpoint /api/sms/inbound/ (Twilio webhook).
    """
    service = SMSInboundService()
    return service.traiter_sms_twilio(phone_number, message_text, provider_id)
