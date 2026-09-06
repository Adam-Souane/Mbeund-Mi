from django.contrib.gis.db import models

class Utilisateur(models.Model):
    ROLE_CHOICES = [
        ('CITOYEN', 'Citoyen'),
        ('AGENT', 'Agent Terrain'),
        ('ADMINISTRATEUR', 'Administrateur'),
        ('DECIDEUR', 'Décideur / Autorité'),
    ]

    email = models.EmailField(max_length=150, unique=True)
    mot_de_passe = models.CharField(max_length=255)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='CITOYEN')
    telephone = models.CharField(max_length=20, null=True, blank=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'utilisateur'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"


class ZonePilote(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    geom = models.PolygonField(srid=4326) # WGS 84
    description = models.TextField(null=True, blank=True)
    score_risque_moyen = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'zone_pilote'
        verbose_name = 'Zone Pilote'
        verbose_name_plural = 'Zones Pilotes'

    def __str__(self):
        return self.nom


class SegmentRue(models.Model):
    ETAT_DRAINAGE_CHOICES = [
        ('Bon', 'Bon'),
        ('Moyen', 'Moyen'),
        ('Obstrué', 'Obstrué'),
        ('Inexistant', 'Inexistant'),
    ]

    nom = models.CharField(max_length=150, null=True, blank=True)
    geom = models.LineStringField(srid=4326) # WGS 84
    altitude_moyenne = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pente = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    etat_drainage = models.CharField(max_length=50, choices=ETAT_DRAINAGE_CHOICES, default='Bon')
    zone_pilote = models.ForeignKey(ZonePilote, on_delete=models.SET_NULL, null=True, blank=True, related_name='segments')
    score_risque_actuel = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'segment_rue'
        verbose_name = 'Segment de Rue'
        verbose_name_plural = 'Segments de Rue'

    def __str__(self):
        return self.nom or f"Segment #{self.id}"


class ObservationTerrain(models.Model):
    TYPE_OBSERVATION_CHOICES = [
        ('Accumulation eau', 'Accumulation eau'),
        ('Obstruction canalisation', 'Obstruction canalisation'),
        ('Inondation', 'Inondation'),
        ('Autre', 'Autre'),
    ]

    type_observation = models.CharField(max_length=50, choices=TYPE_OBSERVATION_CHOICES)
    valeur = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    geom = models.PointField(srid=4326) # WGS 84
    photo_url = models.CharField(max_length=255, null=True, blank=True)
    date_observation = models.DateTimeField(auto_now_add=True)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name='observations')
    observateur = models.CharField(max_length=100, null=True, blank=True)
    valide = models.BooleanField(default=True)

    class Meta:
        db_table = 'observation_terrain'
        verbose_name = 'Observation Terrain'
        verbose_name_plural = 'Observations Terrain'

    def __str__(self):
        return f"{self.type_observation} ({self.date_observation.strftime('%Y-%m-%d %H:%M')})"


class CapteurIoT(models.Model):
    TYPE_CAPTEUR_CHOICES = [
        ('LIMNIMETRE', 'Limnimètre'),
        ('PLUVIOMETRE', 'Pluviomètre'),
    ]
    STATUT_CHOICES = [
        ('ACTIF', 'Actif'),
        ('INACTIF', 'Inactif'),
        ('MAINTENANCE', 'En maintenance'),
    ]

    code_identifiant = models.CharField(max_length=50, unique=True)
    type_capteur = models.CharField(max_length=30, choices=TYPE_CAPTEUR_CHOICES)
    geom = models.PointField(srid=4326) # WGS 84
    zone_pilote = models.ForeignKey(ZonePilote, on_delete=models.SET_NULL, null=True, blank=True, related_name='capteurs')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ACTIF')
    dernier_releve = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'capteur_iot'
        verbose_name = 'Capteur IoT'
        verbose_name_plural = 'Capteurs IoT'

    def __str__(self):
        return f"{self.code_identifiant} ({self.type_capteur})"


class PrevisionMeteo(models.Model):
    date_prevision = models.DateTimeField()
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    precipitation = models.DecimalField(max_digits=5, decimal_places=2)
    vitesse_vent = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    source = models.CharField(max_length=100, default='ANACIM')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prevision_meteo'
        verbose_name = 'Prévision Météo'
        verbose_name_plural = 'Prévisions Météo'

    def __str__(self):
        return f"Prévision {self.date_prevision.strftime('%Y-%m-%d %H:%M')} : {self.precipitation}mm"


class Alerte(models.Model):
    NIVEAU_CHOICES = [
        ('JAUNE', 'Jaune'),
        ('ORANGE', 'Orange'),
        ('ROUGE', 'Rouge'),
    ]
    STATUT_CHOICES = [
        ('ACTIVE', 'Active'),
        ('RESOLUE', 'Résolue'),
        ('ARCHIVEE', 'Archivée'),
    ]

    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES)
    message = models.TextField()
    geom = models.GeometryField(srid=4326, null=True, blank=True)
    zone_pilote = models.ForeignKey(ZonePilote, on_delete=models.SET_NULL, null=True, blank=True, related_name='alertes')
    date_emission = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ACTIVE')

    class Meta:
        db_table = 'alerte'
        verbose_name = 'Alerte'
        verbose_name_plural = 'Alertes'

    def __str__(self):
        return f"Alerte {self.niveau} - {self.zone_pilote.nom if self.zone_pilote else 'Globale'}"


class HistoriqueRisque(models.Model):
    TYPE_CIBLE_CHOICES = [
        ('ZONE', 'Zone Pilote'),
        ('SEGMENT', 'Segment de Rue'),
    ]

    type_cible = models.CharField(max_length=20, choices=TYPE_CIBLE_CHOICES)
    cible_id = models.IntegerField()
    score_risque = models.DecimalField(max_digits=4, decimal_places=2)
    date_calcul = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'historique_risque'
        verbose_name = 'Historique Risque'
        verbose_name_plural = 'Historiques Risque'

    def __str__(self):
        return f"{self.type_cible} #{self.cible_id} - Score {self.score_risque}"
