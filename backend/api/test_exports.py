"""Exports CSV et PDF (réservés aux autorités), backtesting et fiabilité du modèle."""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from alertes.models import Alerte, ZoneRisque


def client_role(role):
    user = User.objects.create_user(username=f'u_{role}', password='motdepasse123')
    user.profile.role = role
    user.profile.save()
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def donnees(db):
    zone = ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))", quartier="Thiaroye Gare", niveau_risque="orange",
    )
    Alerte.objects.create(niveau="orange", zone=zone, timestamp=timezone.now(), statut="envoyee", message="Montée des eaux")
    return zone


@pytest.mark.django_db
@pytest.mark.parametrize('export_type', ['alertes', 'signalements', 'zones', 'predictions', 'refuges', 'episodes'])
def test_export_csv(donnees, export_type):
    reponse = client_role('autorite').get(f'/api/export/csv/{export_type}/')
    assert reponse.status_code == 200
    assert reponse['Content-Type'].startswith('text/csv')
    assert 'attachment' in reponse['Content-Disposition']
    contenu = b''.join(reponse.streaming_content) if reponse.streaming else reponse.content
    assert contenu  # au moins la ligne d'en-tête
    if export_type == 'alertes':
        assert 'Thiaroye Gare' in contenu.decode('utf-8-sig')


@pytest.mark.django_db
@pytest.mark.parametrize('export_type', ['alertes', 'signalements'])
def test_export_pdf(donnees, export_type):
    reponse = client_role('autorite').get(f'/api/export/pdf/{export_type}/')
    assert reponse.status_code == 200
    assert reponse['Content-Type'] == 'application/pdf'
    contenu = b''.join(reponse.streaming_content) if reponse.streaming else reponse.content
    assert contenu.startswith(b'%PDF')


@pytest.mark.django_db
def test_exports_refuses_aux_citoyens_et_types_inconnus(donnees):
    assert client_role('citoyen').get('/api/export/csv/alertes/').status_code == 403
    autorite = client_role('autorite')
    assert autorite.get('/api/export/csv/inconnu/').status_code == 400
    assert autorite.get('/api/export/pdf/inconnu/').status_code == 400


@pytest.mark.django_db
def test_backtesting(donnees):
    reponse = client_role('autorite').get('/api/inondations/backtesting/', {'include_synthetic': 'false'})
    assert reponse.status_code == 200


@pytest.mark.django_db
def test_fiabilite_du_modele():
    reponse = client_role('autorite').get('/api/predictions/fiabilite/')
    assert reponse.status_code == 200
