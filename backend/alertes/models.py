from django.db import models
from api.fields import SpatialPointField, SpatialPolygonField, SpatialMultiPolygonField

class ZoneRisque(models.Model):
    NIVEAU_RISQUE_CHOICES = [
        ('vert', 'Vert'),
        ('jaune', 'Jaune'),
        ('orange', 'Orange'),
        ('rouge', 'Rouge'),
    ]
    geom = SpatialPolygonField(srid=4326)
    quartier = models.CharField(max_length=100)
    niveau_risque = models.CharField(max_length=20, choices=NIVEAU_RISQUE_CHOICES)

    class Meta:
        verbose_name = "Zone de risque"
        verbose_name_plural = "Zones de risque"

    def __str__(self):
        return f"{self.quartier} ({self.get_niveau_risque_display()})"


class Alerte(models.Model):
    NIVEAU_CHOICES = [
        ('vert', 'Vert'),
        ('jaune', 'Jaune'),
        ('orange', 'Orange'),
        ('rouge', 'Rouge'),
    ]
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('envoyee', 'Envoyée'),
        ('resolue', 'Résolue'),
    ]
    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES)
    zone = models.ForeignKey(ZoneRisque, on_delete=models.CASCADE, related_name='alertes')
    timestamp = models.DateTimeField()
    canaux = models.CharField(max_length=100, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')

    class Meta:
        verbose_name = "Alerte"
        verbose_name_plural = "Alertes"
        ordering = ['-timestamp']

    def __str__(self):
        return f"Alerte {self.get_niveau_display()} - {self.zone.quartier} ({self.get_statut_display()})"


class EpisodeInondation(models.Model):
    geom = SpatialMultiPolygonField(srid=4326)
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField(null=True, blank=True)
    surface_ha = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name = "Épisode d'inondation"
        verbose_name_plural = "Épisodes d'inondations"
        ordering = ['-date_debut']

    def __str__(self):
        return f"Épisode du {self.date_debut}"


class PredictionIA(models.Model):
    zone = models.ForeignKey(ZoneRisque, on_delete=models.CASCADE, related_name='predictions')
    probabilite = models.FloatField()
    horizon_h = models.IntegerField()
    confiance = models.FloatField()
    timestamp = models.DateTimeField()

    class Meta:
        verbose_name = "Prédiction IA"
        verbose_name_plural = "Prédictions IA"
        ordering = ['-timestamp']

    def __str__(self):
        return f"Prédiction {self.zone.quartier} - {self.probabilite * 100:.1f}% à {self.horizon_h}h"


class SignalementCitoyen(models.Model):
    CATEGORIE_CHOICES = [
        ('egouts', 'Égouts'),
        ('inondation', 'Inondation'),
        ('autre', 'Autre'),
    ]
    localisation = SpatialPointField(srid=4326)
    description = models.TextField(blank=True)
    photo = models.FileField(upload_to='signalements/', null=True, blank=True)
    valide = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, default='autre')

    class Meta:
        verbose_name = "Signalement citoyen"
        verbose_name_plural = "Signalements citoyens"
        ordering = ['-date_creation']

    def __str__(self):
        return f"Signalement {self.get_categorie_display()} - {self.date_creation}"
