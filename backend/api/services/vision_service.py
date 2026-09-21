"""
Analyse heuristique des photos de signalement citoyen.

Ce n'est PAS un modèle de vision entraîné : sans dataset de photos
d'inondations annotées propre à Thiaroye-sur-Mer, un vrai modèle (CNN)
aurait été peu fiable et impossible à valider honnêtement. On utilise à la
place deux heuristiques simples et explicables :

- `analyser_photo` estime un niveau d'eau visible à partir de la teinte des
  pixels dans la moitié basse de l'image (là où l'eau stagnante apparaît
  typiquement sur une photo prise au niveau de la rue), et calcule un hash
  perceptuel pour repérer les doublons.
- `trouve_signalement_similaire` compare ce hash à celui des signalements
  récents pour flaguer les photos quasi identiques (doublons probables),
  afin d'aider l'autorité à trier plus vite.
"""
from datetime import timedelta

import numpy as np
from PIL import Image
from django.utils import timezone

# Teinte marron-grisâtre à bleu-grisâtre (eau trouble/stagnante), saturation
# et luminosité modérées — en mode HSV Pillow (canaux 0-255).
_HUE_MIN, _HUE_MAX = 15, 150
_SAT_MAX = 140
_VAL_MIN, _VAL_MAX = 40, 200

# Score = proportion de pixels "eau" dans la moitié basse de l'image.
_NIVEAU_THRESHOLDS = (
    (0.40, 'eleve'),
    (0.15, 'modere'),
)

# Deux photos dont le hash diffère de 6 bits ou moins sur 64 (~9%) sont
# considérées comme quasi identiques — assez strict pour éviter les faux
# positifs entre deux scènes d'inondation différentes mais visuellement
# proches (rue grise, ciel nuageux).
SEUIL_DOUBLON = 6
FENETRE_DOUBLON_JOURS = 7


def analyser_photo(file_obj):
    """
    Retourne {'niveau_eau_estime', 'score_eau_estime', 'photo_hash'} à
    partir d'un fichier image ouvrable par Pillow. Ne lève jamais
    d'exception : retourne des valeurs neutres si l'image ne peut pas être
    analysée (l'appelant a déjà validé qu'il s'agit d'une image valide,
    mais on reste défensif).
    """
    try:
        file_obj.seek(0)
        with Image.open(file_obj) as img:
            img = img.convert('RGB')
            score = _score_eau(img)
            phash = _average_hash(img)
    except Exception:
        return {'niveau_eau_estime': 'indetermine', 'score_eau_estime': None, 'photo_hash': ''}
    finally:
        try:
            file_obj.seek(0)
        except Exception:
            pass

    niveau = 'faible'
    for seuil, label in _NIVEAU_THRESHOLDS:
        if score >= seuil:
            niveau = label
            break

    return {'niveau_eau_estime': niveau, 'score_eau_estime': round(score, 3), 'photo_hash': phash}


def _score_eau(img):
    w, h = img.size
    bas = img.crop((0, h // 2, w, h)).resize((80, 80))
    hsv = np.array(bas.convert('HSV'), dtype=np.int16)
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    masque_eau = (
        (hue >= _HUE_MIN) & (hue <= _HUE_MAX)
        & (sat <= _SAT_MAX)
        & (val >= _VAL_MIN) & (val <= _VAL_MAX)
    )
    return float(masque_eau.mean())


def _average_hash(img, taille=8):
    """Average hash (aHash) : empreinte perceptuelle 64 bits, robuste aux
    recompressions mineures — utilisée par trouve_signalement_similaire."""
    petite = img.convert('L').resize((taille, taille))
    pixels = np.array(petite, dtype=np.int16)
    bits = (pixels > pixels.mean()).flatten()
    valeur = 0
    for bit in bits:
        valeur = (valeur << 1) | int(bit)
    return format(valeur, '016x')


def _hamming_distance(hash_a, hash_b):
    return bin(int(hash_a, 16) ^ int(hash_b, 16)).count('1')


def trouve_signalement_similaire(photo_hash, queryset, exclude_id=None):
    """
    Retourne le signalement le plus proche par hash perceptuel parmi ceux
    des `FENETRE_DOUBLON_JOURS` derniers jours (avec photo), ou None si
    aucun n'est assez proche pour être un doublon probable.
    """
    if not photo_hash:
        return None

    seuil_date = timezone.now() - timedelta(days=FENETRE_DOUBLON_JOURS)
    candidats = queryset.filter(date_creation__gte=seuil_date).exclude(photo_hash='')
    if exclude_id is not None:
        candidats = candidats.exclude(id=exclude_id)

    meilleur, meilleure_distance = None, None
    for candidat in candidats:
        distance = _hamming_distance(photo_hash, candidat.photo_hash)
        if meilleure_distance is None or distance < meilleure_distance:
            meilleur, meilleure_distance = candidat, distance

    if meilleur is not None and meilleure_distance <= SEUIL_DOUBLON:
        return meilleur
    return None
