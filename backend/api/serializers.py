from rest_framework import serializers
from .models import (
    Utilisateur, ZonePilote, SegmentRue, ObservationTerrain,
    CapteurIoT, PrevisionMeteo, Alerte, HistoriqueRisque
)

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'nom', 'prenom', 'role', 'telephone', 'actif', 'created_at']
        extra_kwargs = {'mot_de_passe': {'write_only': True}}


class ZonePiloteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZonePilote
        fields = ['id', 'nom', 'geom', 'description', 'score_risque_moyen', 'created_at']


class SegmentRueSerializer(serializers.ModelSerializer):
    zone_pilote_nom = serializers.ReadOnlyField(source='zone_pilote.nom')

    class Meta:
        model = SegmentRue
        fields = ['id', 'nom', 'geom', 'altitude_moyenne', 'pente', 'etat_drainage', 'zone_pilote', 'zone_pilote_nom', 'score_risque_actuel', 'created_at']


class ObservationTerrainSerializer(serializers.ModelSerializer):
    observateur_nom = serializers.SerializerMethodField()

    class Meta:
        model = ObservationTerrain
        fields = ['id', 'type_observation', 'valeur', 'description', 'geom', 'photo_url', 'date_observation', 'utilisateur', 'observateur', 'observateur_nom', 'valide']

    def get_observateur_nom(self, obj):
        if obj.utilisateur:
            return f"{obj.utilisateur.prenom} {obj.utilisateur.nom}"
        return obj.observateur or "Anonyme"


class CapteurIoTSerializer(serializers.ModelSerializer):
    zone_pilote_nom = serializers.ReadOnlyField(source='zone_pilote.nom')

    class Meta:
        model = CapteurIoT
        fields = ['id', 'code_identifiant', 'type_capteur', 'geom', 'zone_pilote', 'zone_pilote_nom', 'statut', 'dernier_releve', 'created_at']


class PrevisionMeteoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrevisionMeteo
        fields = ['id', 'date_prevision', 'temperature', 'precipitation', 'vitesse_vent', 'source', 'created_at']


class AlerteSerializer(serializers.ModelSerializer):
    zone_pilote_nom = serializers.ReadOnlyField(source='zone_pilote.nom')

    class Meta:
        model = Alerte
        fields = ['id', 'niveau', 'message', 'geom', 'zone_pilote', 'zone_pilote_nom', 'date_emission', 'date_expiration', 'statut']


class HistoriqueRisqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriqueRisque
        fields = ['id', 'type_cible', 'cible_id', 'score_risque', 'date_calcul', 'details']
