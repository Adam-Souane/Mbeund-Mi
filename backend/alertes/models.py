from django.db import models
from api.fields import SpatialPointField, SpatialPolygonField, SpatialMultiPolygonField, SpatialLineStringField

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
    description = models.TextField(blank=True)
    score_risque_moyen = models.DecimalField(max_digits=4, decimal_places=2, default=0)

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
    message = models.TextField(blank=True)
    timestamp = models.DateTimeField()
    date_expiration = models.DateTimeField(null=True, blank=True)
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
    signale_par = models.ForeignKey(
        'auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='signalements'
    )

    class Meta:
        verbose_name = "Signalement citoyen"
        verbose_name_plural = "Signalements citoyens"
        ordering = ['-date_creation']

    def __str__(self):
        return f"Signalement {self.get_categorie_display()} - {self.date_creation}"


class SegmentRue(models.Model):
    ETAT_DRAINAGE_CHOICES = [
        ('bon', 'Bon'),
        ('moyen', 'Moyen'),
        ('obstrue', 'Obstrué'),
        ('inexistant', 'Inexistant'),
    ]
    nom = models.CharField(max_length=150, blank=True)
    geom = SpatialLineStringField(srid=4326)
    zone = models.ForeignKey(ZoneRisque, on_delete=models.SET_NULL, null=True, blank=True, related_name='segments')
    altitude_moyenne = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pente = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    etat_drainage = models.CharField(max_length=20, choices=ETAT_DRAINAGE_CHOICES, default='bon')
    score_risque_actuel = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Segment de rue"
        verbose_name_plural = "Segments de rue"

    def __str__(self):
        return self.nom or f"Segment #{self.pk}"


class PrevisionMeteo(models.Model):
    date_prevision = models.DateTimeField()
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    precipitation = models.DecimalField(max_digits=5, decimal_places=2)
    vitesse_vent = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    # Source des données : open-source (OpenWeatherMap, Open-Meteo) en attendant une
    # réponse de l'ANACIM sur l'accès aux historiques de pluie officiels.
    source = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Prévision météo"
        verbose_name_plural = "Prévisions météo"
        ordering = ['-date_prevision']

    def __str__(self):
        return f"Prévision {self.date_prevision.strftime('%Y-%m-%d %H:%M')} : {self.precipitation}mm"


class HistoriqueRisque(models.Model):
    # FK réelles plutôt qu'un couple (type_cible, cible_id) libre : garantit
    # l'intégrité référentielle (impossible de viser une zone/segment inexistant
    # ou supprimé) au lieu d'un entier sans contrainte.
    zone = models.ForeignKey(
        ZoneRisque, on_delete=models.CASCADE, null=True, blank=True, related_name='historique_risque'
    )
    segment = models.ForeignKey(
        SegmentRue, on_delete=models.CASCADE, null=True, blank=True, related_name='historique_risque'
    )
    score_risque = models.DecimalField(max_digits=4, decimal_places=2)
    date_calcul = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True)

    class Meta:
        verbose_name = "Historique de risque"
        verbose_name_plural = "Historiques de risque"
        ordering = ['-date_calcul']
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(zone__isnull=False, segment__isnull=True) |
                    models.Q(zone__isnull=True, segment__isnull=False)
                ),
                name='historique_risque_une_seule_cible',
            )
        ]

    def __str__(self):
        return f"{self.cible} - score {self.score_risque}"

    @property
    def cible(self):
        return self.zone or self.segment

    @property
    def type_cible(self) -> str:
        return 'zone' if self.zone_id else 'segment'
