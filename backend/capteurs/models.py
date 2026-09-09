from django.db import models
from api.fields import SpatialPointField

class Capteur(models.Model):
    TYPE_CHOICES = [
        ('eau', 'Eau'),
        ('pluviometre', 'Pluviomètre'),
    ]
    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('inactif', 'Inactif'),
        ('maintenance', 'En maintenance'),
    ]
    nom = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    localisation = SpatialPointField(srid=4326)
    code_identifiant = models.CharField(max_length=50, unique=True, null=True, blank=True)
    zone = models.ForeignKey(
        'alertes.ZoneRisque', on_delete=models.SET_NULL, null=True, blank=True, related_name='capteurs'
    )
    actif = models.BooleanField(default=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='actif')
    dernier_releve = models.DateTimeField(null=True, blank=True)
    date_installation = models.DateField()

    class Meta:
        verbose_name = "Capteur"
        verbose_name_plural = "Capteurs"

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()})"


class Mesure(models.Model):
    capteur = models.ForeignKey(Capteur, on_delete=models.CASCADE, related_name='mesures')
    valeur = models.FloatField()
    unite = models.CharField(max_length=20)
    timestamp = models.DateTimeField()

    class Meta:
        verbose_name = "Mesure"
        verbose_name_plural = "Mesures"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.capteur.nom} - {self.valeur} {self.unite} @ {self.timestamp}"
