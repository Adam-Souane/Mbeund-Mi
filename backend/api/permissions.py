from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAutoriteOrAdmin(BasePermission):
    """
    Permission DRF personnalisée IsAutoriteOrAdmin.
    - Accès en lecture (SAFE_METHODS : GET, HEAD, OPTIONS) autorisé pour tout utilisateur authentifié.
    - Accès en écriture (création/modification/suppression) autorisé uniquement :
      * Aux administrateurs Django (is_staff=True ou is_superuser=True)
      * Aux utilisateurs ayant un profil lié avec le rôle 'admin' ou 'autorite'.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Lecture autorisée pour tout utilisateur authentifié
        if request.method in SAFE_METHODS:
            return True

        # Django staff / superusers ont tous les droits
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Vérification du rôle dans le Profile OneToOne
        profile = getattr(request.user, 'profile', None)
        if profile and profile.role in ['admin', 'autorite']:
            return True

        return False
