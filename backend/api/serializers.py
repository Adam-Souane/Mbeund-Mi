from rest_framework import serializers
from .models import Zone, Mesure, Alerte, Signalement

class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = '__all__'

class MesureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesure
        fields = '__all__'

class AlerteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerte
        fields = '__all__'

class SignalementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = '__all__'
