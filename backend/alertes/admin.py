from django.contrib import admin
from django.utils.html import format_html
from .models import ZoneRisque, Alerte, EpisodeInondation, PredictionIA, SignalementCitoyen

@admin.register(ZoneRisque)
class ZoneRisqueAdmin(admin.ModelAdmin):
    list_display = ('quartier', 'niveau_risque_badge', 'geom')
    list_filter = ('niveau_risque',)
    search_fields = ('quartier',)

    @admin.display(description="Niveau de Risque")
    def niveau_risque_badge(self, obj):
        colors = {
            'vert': ('#d4edda', '#155724', 'Vert'),
            'jaune': ('#fff3cd', '#856404', 'Jaune'),
            'orange': ('#ffe8d6', '#a0522d', 'Orange'),
            'rouge': ('#f8d7da', '#721c24', 'Rouge'),
        }
        bg, fg, label = colors.get(obj.niveau_risque, ('#e2e3e5', '#383d41', obj.niveau_risque))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block;">{}</span>',
            bg, fg, label
        )

@admin.register(Alerte)
class AlerteAdmin(admin.ModelAdmin):
    list_display = ('id', 'niveau_badge', 'zone', 'timestamp', 'canaux', 'statut_badge')
    list_filter = ('niveau', 'statut', 'timestamp', 'zone')
    search_fields = ('zone__quartier', 'canaux')
    list_select_related = ('zone',)
    actions = ['marquer_comme_resolue']

    @admin.display(description="Niveau d'Alerte")
    def niveau_badge(self, obj):
        colors = {
            'vert': ('#d4edda', '#155724', 'Vert'),
            'jaune': ('#fff3cd', '#856404', 'Jaune'),
            'orange': ('#ffe8d6', '#a0522d', 'Orange'),
            'rouge': ('#f8d7da', '#721c24', 'Rouge'),
        }
        bg, fg, label = colors.get(obj.niveau, ('#e2e3e5', '#383d41', obj.niveau))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block;">{}</span>',
            bg, fg, label
        )

    @admin.display(description="Statut")
    def statut_badge(self, obj):
        colors = {
            'en_attente': ('#e2e3e5', '#383d41', 'En attente'),
            'envoyee': ('#cce5ff', '#004085', 'Envoyée'),
            'resolue': ('#d4edda', '#155724', 'Résolue'),
        }
        bg, fg, label = colors.get(obj.statut, ('#ffffff', '#000000', obj.statut))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block;">{}</span>',
            bg, fg, label
        )

    @admin.action(description="Marquer comme résolue")
    def marquer_comme_resolue(self, request, queryset):
        rows_updated = queryset.update(statut='resolue')
        if rows_updated == 1:
            message_bit = "1 alerte a été marquée"
        else:
            message_bit = f"{rows_updated} alertes ont été marquées"
        self.message_user(request, f"{message_bit} comme résolue(s) avec succès.")

@admin.register(EpisodeInondation)
class EpisodeInondationAdmin(admin.ModelAdmin):
    list_display = ('date_debut', 'date_fin', 'surface_ha', 'geom')
    list_filter = ('date_debut', 'date_fin')

@admin.register(PredictionIA)
class PredictionIAAdmin(admin.ModelAdmin):
    list_display = ('zone', 'probabilite', 'horizon_h', 'confiance', 'timestamp')
    list_filter = ('zone', 'timestamp')

@admin.register(SignalementCitoyen)
class SignalementCitoyenAdmin(admin.ModelAdmin):
    list_display = ('categorie', 'valide', 'date_creation', 'localisation')
    list_filter = ('categorie', 'valide', 'date_creation')
    search_fields = ('description',)
