from django.db import models
from PIL import Image
import io
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

class Zone(models.Model):
    NIVEAUX_RISQUE = [
        ('vert', 'Vert (Normal)'),
        ('jaune', 'Jaune (Vigilance)'),
        ('orange', 'Orange (Alerte)'),
        ('rouge', 'Rouge (Urgence)'),
    ]
    
    nom = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    niveau_alerte_actuel = models.CharField(max_length=10, choices=NIVEAUX_RISQUE, default='vert')
    
    def __str__(self):
        return f"{self.nom} - {self.niveau_alerte_actuel}"

class Mesure(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='mesures')
    niveau_eau_cm = models.FloatField()
    pluviometrie_mm = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"Mesure {self.zone.nom} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"

class Alerte(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='alertes')
    niveau = models.CharField(max_length=10, choices=Zone.NIVEAUX_RISQUE)
    message = models.TextField()
    date_declenchement = models.DateTimeField(auto_now_add=True)
    est_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-date_declenchement']
        
    def __str__(self):
        statut = "Active" if self.est_active else "Résolue"
        return f"Alerte {self.niveau.upper()} - {self.zone.nom} ({statut})"

class Signalement(models.Model):
    TYPES_PROBLEMES = [
        ('inondation', 'Inondation / Montée des eaux'),
        ('egout_bouche', 'Égout bouché'),
        ('dechets', 'Déchets accumulés empêchant l\'eau de couler'),
        ('infrastructure', 'Infrastructure endommagée (route, pont)'),
        ('autre', 'Autre problème'),
    ]
    
    type_probleme = models.CharField(max_length=50, choices=TYPES_PROBLEMES)
    latitude = models.FloatField()
    longitude = models.FloatField()
    description = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='signalements_photos/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, default='nouveau', choices=[('nouveau', 'Nouveau'), ('valide', 'Validé'), ('rejete', 'Rejeté')])

    def save(self, *args, **kwargs):
        # Compression de l'image avant la sauvegarde pour ne pas saturer le serveur
        if self.photo and not self.photo.closed:
            img = Image.open(self.photo)
            
            # Redimensionnement max 800x800 pour être léger
            img.thumbnail((800, 800), Image.Resampling.LANCZOS)
            
            # Conversion en RGB (nécessaire si l'image est en PNG avec transparence)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            output = io.BytesIO()
            # Sauvegarde en JPEG avec une qualité de 60% (très léger, bonne qualité web)
            img.save(output, format='JPEG', quality=60)
            output.seek(0)
            
            # Remplacement du fichier original par le fichier compressé
            self.photo = InMemoryUploadedFile(
                output, 'ImageField', 
                f"{self.photo.name.split('.')[0]}.jpg", 
                'image/jpeg', sys.getsizeof(output), None
            )
            
        super(Signalement, self).save(*args, **kwargs)

    def __str__(self):
        return f"Signalement {self.get_type_probleme_display()} à {self.timestamp}"
