import colorsys
from io import BytesIO

import pytest
from PIL import Image

from api.services.vision_service import (
    analyser_photo,
    trouve_signalement_similaire,
    _average_hash,
    _hamming_distance,
)


def _rgb_from_hsv_degrees(h_deg, s, v):
    r, g, b = colorsys.hsv_to_rgb(h_deg / 360, s, v)
    return (round(r * 255), round(g * 255), round(b * 255))


# Marron/olive trouble, saturation et luminosité modérées : tombe dans la
# fenêtre HSV que vision_service considère comme de l'eau stagnante.
_COULEUR_EAU = _rgb_from_hsv_degrees(40, 0.4, 0.45)

# Bleu ciel saturé et lumineux : hors fenêtre (hue et value trop élevés).
_COULEUR_CIEL = _rgb_from_hsv_degrees(220, 0.9, 0.95)


def _image_bicolore(couleur_haut, couleur_bas, size=(160, 160)):
    w, h = size
    img = Image.new('RGB', size, couleur_haut)
    bas = Image.new('RGB', (w, h // 2), couleur_bas)
    img.paste(bas, (0, h // 2))
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    buf.name = 'test.png'
    return buf


def test_analyser_photo_detects_high_water_level():
    photo = _image_bicolore(_COULEUR_CIEL, _COULEUR_EAU)
    result = analyser_photo(photo)
    assert result['niveau_eau_estime'] == 'eleve'
    assert result['score_eau_estime'] > 0.8
    assert len(result['photo_hash']) == 16


def test_analyser_photo_low_water_level_for_dry_scene():
    photo = _image_bicolore(_COULEUR_CIEL, _COULEUR_CIEL)
    result = analyser_photo(photo)
    assert result['niveau_eau_estime'] == 'faible'
    assert result['score_eau_estime'] < 0.15


def test_analyser_photo_never_raises_on_invalid_file():
    bogus = BytesIO(b'not an image')
    bogus.name = 'bogus.png'
    result = analyser_photo(bogus)
    assert result == {'niveau_eau_estime': 'indetermine', 'score_eau_estime': None, 'photo_hash': ''}


def test_hamming_distance_zero_for_identical_hashes():
    img = Image.new('RGB', (64, 64), _COULEUR_EAU)
    h1 = _average_hash(img)
    h2 = _average_hash(img)
    assert _hamming_distance(h1, h2) == 0


def test_hamming_distance_positive_for_different_images():
    # Une image unie n'a aucune variance de pixel à pixel : son average hash
    # est toujours 0 quelle que soit sa couleur. Il faut une vraie variation
    # spatiale (ici un split haut/bas) pour obtenir des hashs distincts.
    img1 = Image.open(_image_bicolore(_COULEUR_CIEL, _COULEUR_EAU))
    img2 = Image.open(_image_bicolore(_COULEUR_EAU, _COULEUR_CIEL))
    assert _hamming_distance(_average_hash(img1), _average_hash(img2)) > 0


@pytest.mark.django_db
def test_trouve_signalement_similaire_flags_near_duplicate():
    from alertes.models import SignalementCitoyen

    photo = _image_bicolore(_COULEUR_CIEL, _COULEUR_EAU)
    phash = analyser_photo(photo)['photo_hash']

    existant = SignalementCitoyen.objects.create(
        localisation="POINT(-17.38 14.75)", categorie='inondation', photo_hash=phash,
    )

    similaire = trouve_signalement_similaire(phash, SignalementCitoyen.objects.all())
    assert similaire is not None
    assert similaire.id == existant.id


@pytest.mark.django_db
def test_trouve_signalement_similaire_ignores_old_signalements():
    from django.utils import timezone
    from datetime import timedelta
    from alertes.models import SignalementCitoyen

    photo = _image_bicolore(_COULEUR_CIEL, _COULEUR_EAU)
    phash = analyser_photo(photo)['photo_hash']

    ancien = SignalementCitoyen.objects.create(
        localisation="POINT(-17.38 14.75)", categorie='inondation', photo_hash=phash,
    )
    SignalementCitoyen.objects.filter(id=ancien.id).update(
        date_creation=timezone.now() - timedelta(days=30)
    )

    assert trouve_signalement_similaire(phash, SignalementCitoyen.objects.all()) is None


@pytest.mark.django_db
def test_trouve_signalement_similaire_returns_none_without_match():
    from alertes.models import SignalementCitoyen

    photo = _image_bicolore(_COULEUR_CIEL, _COULEUR_EAU)
    phash = analyser_photo(photo)['photo_hash']

    autre_photo = _image_bicolore(_COULEUR_EAU, _COULEUR_CIEL)
    autre_hash = analyser_photo(autre_photo)['photo_hash']
    SignalementCitoyen.objects.create(
        localisation="POINT(-17.38 14.75)", categorie='inondation', photo_hash=autre_hash,
    )

    assert trouve_signalement_similaire(phash, SignalementCitoyen.objects.all()) is None
