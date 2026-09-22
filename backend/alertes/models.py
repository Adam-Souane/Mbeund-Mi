from django.db import models
from django.contrib.auth.models import User
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
    is_synthetic = models.BooleanField(default=False, help_text="TRUE = donnée de test/démo, FALSE = vraie inondation observée")

    class Meta:
        verbose_name = "Épisode d'inondation"
        verbose_name_plural = "Épisodes d'inondations"
        ordering = ['-date_debut']

    def __str__(self):
        suffix = " (test)" if self.is_synthetic else ""
        return f"Épisode du {self.date_debut}{suffix}"


class PointRefuge(models.Model):
    """Points de refuge/abri en cas d'inondation (écoles, mosquées, centres surélevés, etc.)"""

    TYPE_CHOICES = [
        ('ecole', 'École'),
        ('mosquee', 'Mosquée'),
        ('centre_sante', 'Centre de santé'),
        ('mairie', 'Mairie'),
        ('bâtiment_public', 'Bâtiment public'),
        ('autre', 'Autre'),
    ]

    nom = models.CharField(max_length=200)
    type_refuge = models.CharField(max_length=50, choices=TYPE_CHOICES)
    localisation = SpatialPointField(srid=4326)
    zone = models.ForeignKey(ZoneRisque, on_delete=models.CASCADE, related_name='refuges', null=True, blank=True)
    adresse = models.CharField(max_length=300, blank=True)
    quartier = models.CharField(max_length=100)
    capacite = models.IntegerField(null=True, blank=True, help_text="Nombre de personnes max")
    contact = models.CharField(max_length=50, blank=True, help_text="Numéro de téléphone du responsable")
    hauteur_etage = models.IntegerField(null=True, blank=True, help_text="Nombre d'étages (pour refuges surélevés)")
    notes = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Point de refuge"
        verbose_name_plural = "Points de refuge"
        ordering = ['quartier', 'nom']

    def __str__(self):
        return f"{self.nom} ({self.get_type_refuge_display()}) - {self.quartier}"


class PredictionIA(models.Model):
    zone = models.ForeignKey(ZoneRisque, on_delete=models.CASCADE, related_name='predictions')
    probabilite = models.FloatField()
    horizon_h = models.IntegerField()
    confiance = models.FloatField()
    # Niveau d'eau (cm) prédit pour le lendemain par le modèle LSTM (régression
    # sur 24 jours d'historique pluie/niveau) — distinct de la classification
    # de risque (RandomForest, ci-dessus). Null si moins de 24 jours d'historique
    # de mesures ne sont disponibles pour la zone.
    niveau_eau_predit_cm = models.FloatField(null=True, blank=True)
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
    NIVEAU_EAU_CHOICES = [
        ('indetermine', 'Indéterminé'),
        ('faible', 'Faible'),
        ('modere', 'Modéré'),
        ('eleve', 'Élevé'),
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
    # Renseignés automatiquement à la création si une photo est fournie —
    # voir api/services/vision_service.py (analyse heuristique, pas un
    # modèle entraîné : pas de dataset annoté disponible pour Thiaroye).
    niveau_eau_estime = models.CharField(max_length=20, choices=NIVEAU_EAU_CHOICES, default='indetermine')
    score_eau_estime = models.FloatField(null=True, blank=True)
    photo_hash = models.CharField(max_length=16, blank=True)
    signalement_similaire = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='doublons_potentiels'
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


class ContactAlerte(models.Model):
    """
    Registre des citoyens souhaitant recevoir un SMS lors d'une alerte dans
    leur zone — distinct des Profile (agent/autorite/admin) qui sont déjà
    notifiés systématiquement. Inscription libre (sans compte utilisateur),
    à l'image du signalement citoyen.
    """
    telephone = models.CharField(max_length=20)
    zone = models.ForeignKey(ZoneRisque, on_delete=models.CASCADE, related_name='contacts_alerte')
    nom = models.CharField(max_length=100, blank=True)
    actif = models.BooleanField(default=True)
    date_inscription = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Contact d'alerte"
        verbose_name_plural = "Contacts d'alerte"
        ordering = ['-date_inscription']

    def __str__(self):
        return f"{self.telephone} ({self.zone.quartier})"


class ProfilVulnerabilite(models.Model):
    """
    Déclaration opt-in par un citoyen connecté des personnes vulnérables de
    son foyer — sert à prioriser l'assistance à l'évacuation (autorité et
    relais de quartier), jamais utilisée pour autre chose. Un citoyen ne
    déclare que son propre foyer (voir MonProfilVulnerabiliteView).
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profil_vulnerabilite')
    zone = models.ForeignKey(
        ZoneRisque, on_delete=models.SET_NULL, null=True, blank=True, related_name='profils_vulnerabilite'
    )
    personnes_agees = models.PositiveSmallIntegerField(default=0)
    enfants_bas_age = models.PositiveSmallIntegerField(default=0)
    personne_mobilite_reduite = models.BooleanField(default=False)
    femme_enceinte = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil de vulnérabilité"
        verbose_name_plural = "Profils de vulnérabilité"
        ordering = ['-updated_at']

    @property
    def est_prioritaire(self):
        return bool(
            self.personnes_agees or self.enfants_bas_age
            or self.personne_mobilite_reduite or self.femme_enceinte
        )

    def __str__(self):
        return f"Vulnérabilité de {self.user.username}"


class RelaisQuartier(models.Model):
    """
    Citoyen volontaire pour être notifié en priorité lors d'une alerte dans
    sa zone et aider les foyers vulnérables (voir ProfilVulnerabilite) à
    évacuer. Vérification par une autorité avant d'être considéré fiable
    (`verifie`) — l'inscription seule ne suffit pas.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='relais_quartier')
    zone = models.ForeignKey(ZoneRisque, on_delete=models.CASCADE, related_name='relais')
    verifie = models.BooleanField(default=False)
    disponible = models.BooleanField(default=True)
    date_inscription = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Relais de quartier"
        verbose_name_plural = "Relais de quartier"
        ordering = ['-date_inscription']

    def __str__(self):
        return f"{self.user.username} — relais {self.zone.quartier}"
