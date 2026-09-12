import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from alertes.models import ZoneRisque, PrevisionMeteo, SignalementCitoyen

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_citoyen(db):
    user = User.objects.create_user(username='citoyen', password='password123')
    user.profile.role = 'citoyen'
    user.profile.save()
    return user


@pytest.mark.django_db
def test_chat_requires_authentication(api_client):
    response = api_client.post('/api/chat/', {'question': 'Bonjour'})
    assert response.status_code == 401


@pytest.mark.django_db
def test_chat_requires_question_field(api_client, user_citoyen):
    api_client.force_authenticate(user=user_citoyen)
    response = api_client.post('/api/chat/', {})
    assert response.status_code == 400
    assert 'question' in response.data


@pytest.mark.django_db
def test_chat_rejects_blank_question(api_client, user_citoyen):
    api_client.force_authenticate(user=user_citoyen)
    response = api_client.post('/api/chat/', {'question': '   '})
    assert response.status_code == 400


@pytest.mark.django_db
@patch('api.views._get_chatbot_service')
def test_chat_returns_reply_from_chatbot_service(mock_get_service, api_client, user_citoyen):
    mock_get_service.return_value.poser_question.return_value = "Réponse simulée de NDAM."

    api_client.force_authenticate(user=user_citoyen)
    response = api_client.post('/api/chat/', {'question': "Quel est le risque aujourd'hui ?"})

    assert response.status_code == 200
    assert response.data == {"reply": "Réponse simulée de NDAM."}
    mock_get_service.return_value.poser_question.assert_called_once()
    call_kwargs = mock_get_service.return_value.poser_question.call_args
    assert call_kwargs.args[0] == "Quel est le risque aujourd'hui ?"


@pytest.mark.django_db
@patch('api.views._get_chatbot_service')
def test_chat_gathers_context_without_ndam_touching_db_directly(mock_get_service, api_client, user_citoyen, db):
    """
    Vérifie que Django rassemble bien le contexte (risque/météo/signalements)
    et le passe à poser_question() en simples chaînes/valeurs — jamais un
    objet DB ni un queryset — ce qui est la garantie que NDAM lui-même ne
    touche jamais la base directement.
    """
    ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier="Thiaroye Gare",
        niveau_risque="rouge",
        score_risque_moyen=0.9,
    )
    PrevisionMeteo.objects.create(
        date_prevision=timezone.now(),
        temperature=27,
        precipitation=62,
        vitesse_vent=18,
    )
    SignalementCitoyen.objects.create(
        localisation="POINT(-17.38 14.76)",
        description="Eau stagnante rue 12",
        categorie="inondation",
        valide=True,
    )
    mock_get_service.return_value.poser_question.return_value = "ok"

    api_client.force_authenticate(user=user_citoyen)
    response = api_client.post('/api/chat/', {'question': "Que faire ?"})
    assert response.status_code == 200

    _, kwargs = mock_get_service.return_value.poser_question.call_args
    assert kwargs['niveau_risque'] == 'CRITIQUE'
    assert isinstance(kwargs['meteo_context'], str)
    assert '27' in kwargs['meteo_context']
    assert isinstance(kwargs['signalements_context'], str)
    assert 'Eau stagnante' in kwargs['signalements_context']


@pytest.mark.django_db
@patch('api.views._get_chatbot_service')
def test_chat_defaults_when_no_data_available(mock_get_service, api_client, user_citoyen):
    mock_get_service.return_value.poser_question.return_value = "ok"

    api_client.force_authenticate(user=user_citoyen)
    response = api_client.post('/api/chat/', {'question': "Bonjour"})
    assert response.status_code == 200

    _, kwargs = mock_get_service.return_value.poser_question.call_args
    assert kwargs['niveau_risque'] == 'FAIBLE'
    assert kwargs['meteo_context'] == 'Non disponible'
    assert kwargs['signalements_context'] == 'Aucun récent'
