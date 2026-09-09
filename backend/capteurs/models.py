from django.db import models
from api.fields import SpatialPointField

class Capteur(models.Model):
    TYPE_CHOICES = [
        ('eau', 'Eau'),
        ('pluviometre', 'Pluviomètre'),
    ]
    nom = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    localisation = SpatialPointField(srid=4326)
    actif = models.BooleanField(default=True)
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
