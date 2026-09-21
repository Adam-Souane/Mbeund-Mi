import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from alertes.models import ZoneRisque, SegmentRue
from api.services.routing_service import find_safe_route

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client, db):
    user = User.objects.create_user(username='routeur', password='password123')
    api_client.force_authenticate(user=user)
    return api_client


def make_zone(quartier, niveau_risque, score=0.5):
    return ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier=quartier,
        niveau_risque=niveau_risque,
        score_risque_moyen=score,
    )


def make_segment(nom, coords, zone, risque):
    wkt = 'LINESTRING(' + ', '.join(f'{lon} {lat}' for lon, lat in coords) + ')'
    return SegmentRue.objects.create(
        nom=nom,
        geom=wkt,
        zone=zone,
        etat_drainage='bon' if risque < 0.5 else 'obstrue',
        score_risque_actuel=risque,
    )


@pytest.mark.django_db
def test_find_safe_route_no_segments_returns_none():
    assert find_safe_route(14.75, -17.38) is None


@pytest.mark.django_db
def test_find_safe_route_too_far_from_network_returns_none():
    zone = make_zone('Zone test', 'vert')
    make_segment('Rue test', [(0.0, 0.0), (0.0, 0.01)], zone, 0.1)

    # ~1° de latitude ≈ 111 km, largement au-delà de MAX_DISTANCE_RESEAU_KM (2 km).
    assert find_safe_route(1.0, 1.0) is None


@pytest.mark.django_db
def test_find_safe_route_prefers_lower_risk_path_to_same_zone():
    """
    Deux itinéraires distincts relient le même point de départ au même nœud
    d'arrivée (donc à la même zone) : un chemin direct à haut risque, et un
    détour plus long mais à faible risque. Le coût pondéré doit faire
    préférer le détour, même s'il est physiquement plus long.
    """
    zone_sure = make_zone('Zone sûre', 'vert', score=0.1)

    # Chemin direct : ~2 km, risque élevé (0.9) -> poids ≈ 2 * (1 + 0.9*5) = 11.0
    # Seul ce tronçon porte la zone : c'est lui qui rattache le nœud
    # d'arrivée à `zone_sure`, sans quoi le nœud intermédiaire du détour
    # (moins coûteux à atteindre à lui seul) serait choisi comme cible à sa
    # place, faussant le test.
    make_segment('Rue directe', [(0.0, 0.0), (0.0, 0.018)], zone_sure, 0.9)

    # Détour : deux tronçons ~1.5 km chacun, risque faible (0.05), sans zone
    # -> poids total ≈ 2 * 1.5 * (1 + 0.05*5) ≈ 3.75
    make_segment('Détour 1', [(0.0, 0.0), (0.01, 0.009)], None, 0.05)
    make_segment('Détour 2', [(0.01, 0.009), (0.0, 0.018)], None, 0.05)

    result = find_safe_route(0.0, 0.0)
    assert result is not None
    assert result['zone_arrivee']['quartier'] == 'Zone sûre'
    # Le détour ne traverse aucun tronçon à risque élevé (>= 0.5).
    assert result['segments_risque_traverses'] == []
    # La route suit le détour (3 points), pas le tronçon direct (2 points).
    assert len(result['route']['coordinates']) == 3
    assert result['score_risque_moyen_parcours'] < 0.5


@pytest.mark.django_db
def test_find_safe_route_prefers_lower_risk_zone_even_if_farther():
    """
    Le rang de risque de la zone (vert < jaune < orange < rouge) prime sur le
    coût du trajet : une zone rouge toute proche doit être ignorée au profit
    d'une zone verte plus loin, tant qu'elle reste joignable.
    """
    zone_rouge = make_zone('Zone rouge', 'rouge', score=0.9)
    zone_verte = make_zone('Zone verte', 'vert', score=0.1)

    make_segment('Rue vers rouge', [(0.0, 0.0), (0.0, 0.005)], zone_rouge, 0.1)
    make_segment('Rue vers verte', [(0.0, 0.0), (0.0, -0.02)], zone_verte, 0.1)

    result = find_safe_route(0.0, 0.0)
    assert result is not None
    assert result['zone_arrivee']['quartier'] == 'Zone verte'


@pytest.mark.django_db
def test_itineraire_securise_view_requires_auth(api_client):
    response = api_client.get('/api/itineraire-securise/', {'lat': 14.75, 'lon': -17.38})
    assert response.status_code == 401


@pytest.mark.django_db
def test_itineraire_securise_view_invalid_params(auth_client):
    response = auth_client.get('/api/itineraire-securise/', {'lat': 'abc', 'lon': -17.38})
    assert response.status_code == 400

    response = auth_client.get('/api/itineraire-securise/')
    assert response.status_code == 400


@pytest.mark.django_db
def test_itineraire_securise_view_no_route_available(auth_client):
    response = auth_client.get('/api/itineraire-securise/', {'lat': 14.75, 'lon': -17.38})
    assert response.status_code == 404


@pytest.mark.django_db
def test_itineraire_securise_view_success(auth_client):
    zone = make_zone('Zone sûre', 'vert', score=0.1)
    make_segment('Rue test', [(0.0, 0.0), (0.0, 0.01)], zone, 0.1)

    response = auth_client.get('/api/itineraire-securise/', {'lat': 0.0, 'lon': 0.0})
    assert response.status_code == 200

    data = response.data
    assert data['route']['type'] == 'LineString'
    assert data['zone_arrivee']['quartier'] == 'Zone sûre'
    assert 'distance_km' in data
    assert 'segments_risque_traverses' in data
