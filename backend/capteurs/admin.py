from django.contrib import admin
from .models import Capteur, Mesure

@admin.register(Capteur)
class CapteurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'type', 'actif', 'date_installation', 'localisation')
    list_filter = ('type', 'actif', 'date_installation')
    search_fields = ('nom',)
    ordering = ('nom',)

@admin.register(Mesure)
class MesureAdmin(admin.ModelAdmin):
    list_display = ('capteur', 'valeur', 'unite', 'timestamp')
    list_filter = ('capteur', 'unite', 'timestamp')
    search_fields = ('capteur__nom',)
