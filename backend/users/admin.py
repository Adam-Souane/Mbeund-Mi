from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from users.models import Profile, AuthorityTracking

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profils'

class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)

# Re-enregister UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Profile)

class AuthorityTrackingAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_by', 'crises_gerees', 'requetes_traitees', 'alertes_envoyees', 'heures_travail', 'derniere_connexion')
    list_filter = ('date_creation_compte', 'derniere_connexion')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'created_by__username')
    readonly_fields = ('date_creation_compte',)

admin.site.register(AuthorityTracking, AuthorityTrackingAdmin)
