from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ZoneRisque, Alerte, EpisodeInondation, PredictionIA, SignalementCitoyen,
    SegmentRue, PrevisionMeteo, HistoriqueRisque, ContactAlerte,
    ProfilVulnerabilite, RelaisQuartier, ActivityLog, CrisisManagement,
)

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
    list_display = ('zone', 'probabilite', 'horizon_h', 'confiance', 'niveau_eau_predit_cm', 'timestamp')
    list_filter = ('zone', 'timestamp')

@admin.register(SignalementCitoyen)
class SignalementCitoyenAdmin(admin.ModelAdmin):
    list_display = ('categorie', 'valide', 'niveau_eau_estime', 'signalement_similaire', 'date_creation', 'localisation')
    list_filter = ('categorie', 'valide', 'niveau_eau_estime', 'date_creation')
    search_fields = ('description',)

@admin.register(SegmentRue)
class SegmentRueAdmin(admin.ModelAdmin):
    list_display = ('nom', 'zone', 'etat_drainage', 'score_risque_actuel', 'created_at')
    list_filter = ('etat_drainage', 'zone')
    search_fields = ('nom',)

@admin.register(PrevisionMeteo)
class PrevisionMeteoAdmin(admin.ModelAdmin):
    list_display = ('date_prevision', 'zone', 'temperature_c', 'precipitation_mm', 'humidity_percent', 'source')
    list_filter = ('source', 'date_prevision', 'zone')
    search_fields = ('zone__quartier',)
    list_select_related = ('zone',)

@admin.register(HistoriqueRisque)
class HistoriqueRisqueAdmin(admin.ModelAdmin):
    list_display = ('type_cible', 'cible', 'score_risque', 'date_calcul')
    list_filter = ('date_calcul',)

@admin.register(ContactAlerte)
class ContactAlerteAdmin(admin.ModelAdmin):
    list_display = ('telephone', 'zone', 'nom', 'actif', 'date_inscription')
    list_filter = ('actif', 'zone')
    search_fields = ('telephone', 'nom')

@admin.register(ProfilVulnerabilite)
class ProfilVulnerabiliteAdmin(admin.ModelAdmin):
    list_display = ('user', 'zone', 'est_prioritaire', 'personnes_agees', 'enfants_bas_age', 'personne_mobilite_reduite', 'femme_enceinte', 'updated_at')
    list_filter = ('zone', 'personne_mobilite_reduite', 'femme_enceinte')
    search_fields = ('user__username',)

@admin.register(RelaisQuartier)
class RelaisQuartierAdmin(admin.ModelAdmin):
    list_display = ('user', 'zone', 'verifie', 'disponible', 'date_inscription')
    list_filter = ('verifie', 'disponible', 'zone')
    search_fields = ('user__username',)


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('authority', 'action_type_badge', 'description_short', 'timestamp')
    list_filter = ('action_type', 'timestamp', 'authority')
    search_fields = ('authority__username', 'description')
    readonly_fields = ('timestamp', 'authority', 'action_type', 'description', 'metadata', 'ip_address')
    date_hierarchy = 'timestamp'

    @admin.display(description='Type d\'action')
    def action_type_badge(self, obj):
        colors = {
            'alert_created': '#cce5ff',
            'threshold_changed': '#fff3cd',
            'crisis_started': '#f8d7da',
            'crisis_resolved': '#d4edda',
            'sms_sent': '#e2e3e5',
            'push_sent': '#e2e3e5',
        }
        bg = colors.get(obj.action_type, '#ffffff')
        return format_html(
            '<span style="background-color: {}; padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block;">{}</span>',
            bg, obj.get_action_type_display()
        )

    @admin.display(description='Description')
    def description_short(self, obj):
        return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description


@admin.register(CrisisManagement)
class CrisisManagementAdmin(admin.ModelAdmin):
    list_display = ('authority', 'crisis_date', 'zone', 'status_badge', 'hours_worked', 'notifications_sent', 'resolved_at')
    list_filter = ('status', 'crisis_date', 'zone', 'authority')
    search_fields = ('authority__username', 'zone__quartier')
    readonly_fields = ('created_at', 'duration_hours')
    fieldsets = (
        ('Responsable', {
            'fields': ('authority',)
        }),
        ('Informations de crise', {
            'fields': ('crisis_date', 'zone', 'status')
        }),
        ('Charge de travail', {
            'fields': ('hours_worked', 'duration_hours', 'notifications_sent')
        }),
        ('Résolution', {
            'fields': ('resolved_at', 'notes')
        }),
        ('Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    date_hierarchy = 'crisis_date'

    @admin.display(description='Statut')
    def status_badge(self, obj):
        colors = {
            'ongoing': '#f8d7da',
            'resolved': '#d4edda',
            'archived': '#e2e3e5',
        }
        bg = colors.get(obj.status, '#ffffff')
        return format_html(
            '<span style="background-color: {}; padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block;">{}</span>',
            bg, obj.get_status_display()
        )
