from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import random
import string
from .models import Profile, InviteCode, AuthorityTracking
from .serializers import UserSerializer, ProfileSerializer


def generate_username_options(first_name, last_name, max_options=3):
  """Génère jusqu'à max_options usernames disponibles."""
  username_base = f"{first_name.lower()}{last_name.lower()}".replace(' ', '')
  options = []

  # Essayer le username de base
  if not User.objects.filter(username=username_base).exists():
    options.append(username_base)

  # Ajouter des options avec suffixes numériques
  counter = 2
  while len(options) < max_options:
    candidate = f"{username_base}{counter}"
    if not User.objects.filter(username=candidate).exists():
      options.append(candidate)
    counter += 1

  return options


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='check-username')
    def check_username(self, request):
        """
        GET /api/users/check-username/?first_name=...&last_name=...
        Retourne les usernames disponibles basés sur prénom/nom.
        """
        first_name = request.query_params.get('first_name', '').strip()
        last_name = request.query_params.get('last_name', '').strip()

        if not first_name or not last_name:
            return Response({'detail': 'Prénom et nom requis'}, status=status.HTTP_400_BAD_REQUEST)

        options = generate_username_options(first_name, last_name, max_options=3)

        return Response({
            'options': options,
            'recommended': options[0] if options else None,
        })

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='register')
    def register(self, request):
        """
        POST /api/users/register/
        Enregistre un nouvel utilisateur avec profil.

        Body:
        {
            "email": "...",
            "password": "...",
            "first_name": "...",
            "last_name": "...",
            "telephone": "...",
            "username": "...",
            "role": "citoyen" ou "autorite"
        }
        """
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        telephone = request.data.get('telephone', '')
        username = request.data.get('username', '')
        role = request.data.get('role', 'citoyen')

        # Validation
        if not password or len(password) < 8:
            return Response({'password': 'Mot de passe requis (min. 8 caractères)'}, status=status.HTTP_400_BAD_REQUEST)
        if not telephone:
            return Response({'telephone': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not username:
            return Response({'username': 'Identifiant requis'}, status=status.HTTP_400_BAD_REQUEST)

        # Email est facultatif, mais s'il est fourni, il doit être unique
        if email and User.objects.filter(email=email).exists():
            return Response({'email': 'Cet email est déjà utilisé'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'username choisi est disponible
        if User.objects.filter(username=username).exists():
            return Response({'username': 'Cet identifiant est déjà pris. Veuillez en choisir un autre.'}, status=status.HTTP_400_BAD_REQUEST)

        # Créer l'utilisateur et mettre à jour le profil
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                )

                # Mettre à jour le profil créé automatiquement par le signal post_save
                profile = user.profile
                profile.role = role
                profile.telephone = telephone
                profile.save()

                # Générer et stocker un code OTP (seulement pour citoyens)
                otp = None
                if role == 'citoyen':
                    otp = self._generate_otp()
                    cache_key = f'otp_{username}'
                    cache.set(cache_key, otp, timeout=600)  # 10 minutes
                    # TODO: En production, envoyer par email ou SMS
                    print(f'[DEMO] OTP for {username}: {otp}')

            response_data = {
                'detail': 'Compte créé avec succès',
                'user': UserSerializer(user).data,
                'requires_otp': role == 'citoyen',
            }
            # Afficher le code OTP en démo (à retirer en production)
            if otp:
                response_data['demo_otp'] = otp

            return Response(
                response_data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='admin-register')
    def admin_register(self, request):
        """
        POST /api/users/admin-register/
        Enregistre le premier admin avec un code d'invitation.

        Body:
        {
            "code": "invitation_code",
            "email": "...",
            "password": "...",
            "first_name": "...",
            "last_name": "...",
            "telephone": "..."
        }
        """
        code = request.data.get('code')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        telephone = request.data.get('telephone', '')

        # Valider le code d'invitation
        if not code:
            return Response({'detail': 'Code d\'invitation requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invite = InviteCode.objects.get(code=code)
        except InviteCode.DoesNotExist:
            return Response({'detail': 'Code d\'invitation invalide'}, status=status.HTTP_400_BAD_REQUEST)

        if not invite.is_valid():
            return Response({'detail': 'Code d\'invitation expiré ou déjà utilisé'}, status=status.HTTP_400_BAD_REQUEST)

        # Validation des données
        if not password or len(password) < 8:
            return Response({'password': 'Mot de passe requis (min. 8 caractères)'}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({'email': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not telephone:
            return Response({'telephone': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'email': 'Cet email est déjà utilisé'}, status=status.HTTP_400_BAD_REQUEST)

        # Générer un username unique
        username_base = f"{first_name.lower()}{last_name.lower()}".replace(' ', '')
        username = username_base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{username_base}{counter}"
            counter += 1

        try:
            with transaction.atomic():
                # Créer l'utilisateur admin
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                )

                # Mettre à jour le profil avec rôle admin
                profile = user.profile
                profile.role = 'admin'
                profile.telephone = telephone
                profile.is_verified = True  # Admin vérifié automatiquement
                profile.save()

                # Marquer le code d'invitation comme utilisé
                invite.used = True
                invite.used_at = timezone.now()
                invite.used_by = user
                invite.save()

            return Response(
                {
                    'detail': 'Compte admin créé avec succès',
                    'user': UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password-reset')
    def password_reset(self, request):
        """
        POST /api/users/password-reset/
        Demande une réinitialisation de mot de passe.

        Body (Citoyen): {"telephone": "..."}
        Body (Autorité): {"email": "..."}

        Note: En production, envoyer un SMS (citoyen) ou email (autorité) avec un lien de réinitialisation.
        Pour la démo, retourner juste un succès.
        """
        telephone = request.data.get('telephone')
        email = request.data.get('email')

        # Chercher par téléphone (citoyen)
        if telephone:
            try:
                profile = Profile.objects.get(telephone=telephone)
                user = profile.user
                # TODO: Envoyer un SMS de réinitialisation en production
                return Response(
                    {'detail': 'Instructions envoyées par SMS'},
                    status=status.HTTP_200_OK,
                )
            except Profile.DoesNotExist:
                # Ne pas révéler si le numéro existe (sécurité)
                return Response(
                    {'detail': 'Si ce numéro existe, vous recevrez les instructions'},
                    status=status.HTTP_200_OK,
                )

        # Chercher par email (autorité)
        elif email:
            try:
                user = User.objects.get(email=email)
                # TODO: Envoyer un email de réinitialisation en production
                return Response(
                    {'detail': 'Instructions envoyées par email'},
                    status=status.HTTP_200_OK,
                )
            except User.DoesNotExist:
                # Ne pas révéler si l'email existe (sécurité)
                return Response(
                    {'detail': 'Si cet email existe, vous recevrez les instructions'},
                    status=status.HTTP_200_OK,
                )

        return Response(
            {'detail': 'Téléphone ou email requis'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='create-authority')
    def create_authority(self, request):
        """
        POST /api/users/create-authority/
        Crée un compte autorité (réservé à l'admin).

        Body:
        {
            "first_name": "...",
            "last_name": "...",
            "email": "...",
            "telephone": "...",
            "username": "..."
        }

        Retourne les identifiants générés (username + password temporaire).
        """
        # Vérifier que l'utilisateur est admin
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        email = request.data.get('email')
        telephone = request.data.get('telephone', '')
        username = request.data.get('username', '')

        # Validation
        if not first_name.strip():
            return Response({'first_name': 'Prénom requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not last_name.strip():
            return Response({'last_name': 'Nom requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not username:
            return Response({'username': 'Identifiant requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not email or not email.strip():
            return Response({'email': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        if '@' not in email:
            return Response({'email': 'Email invalide'}, status=status.HTTP_400_BAD_REQUEST)
        if not telephone.strip():
            return Response({'telephone': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'email': 'Cet email est déjà utilisé'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'username choisi est disponible
        if User.objects.filter(username=username).exists():
            return Response({'username': 'Cet identifiant est déjà pris. Veuillez en choisir un autre.'}, status=status.HTTP_400_BAD_REQUEST)

        # Générer un mot de passe temporaire
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

        try:
            with transaction.atomic():
                # Créer l'utilisateur
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=temp_password,
                    first_name=first_name,
                    last_name=last_name,
                )

                # Mettre à jour le profil
                profile = user.profile
                profile.role = 'autorite'
                profile.telephone = telephone
                profile.is_verified = True  # Vérifié automatiquement (créé par admin)
                profile.save()

                # Créer le tracking pour l'autorité
                AuthorityTracking.objects.create(
                    user=user,
                    created_by=request.user
                )

            return Response(
                {
                    'detail': 'Autorité créée avec succès',
                    'username': username,
                    'password': temp_password,
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                    'telephone': telephone,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='list-authorities')
    def list_authorities(self, request):
        """
        GET /api/users/list-authorities/
        Retourne les autorités créées aujourd'hui (pour l'admin).

        Réservé à l'admin.
        """
        # Vérifier que l'utilisateur est admin
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Récupérer les autorités créées aujourd'hui
        today = timezone.now().date()
        authorities = User.objects.filter(
            profile__role='autorite',
            date_joined__date=today
        ).values('username', 'first_name', 'last_name', 'email', 'date_joined').order_by('-date_joined')

        return Response(
            {'authorities': list(authorities), 'count': len(authorities)},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='regenerate-authority-password')
    def regenerate_authority_password(self, request):
        """
        POST /api/users/regenerate-authority-password/
        Régénère le mot de passe d'une autorité (admin seulement).

        Body:
        {
            "username": "..."
        }
        """
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get('username')
        if not username:
            return Response(
                {'detail': 'Username requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)

            # Générer un nouveau mot de passe
            new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            user.set_password(new_password)
            user.save()

            return Response(
                {
                    'detail': 'Mot de passe régénéré avec succès',
                    'username': username,
                    'password': new_password,
                },
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='delete-authority')
    def delete_authority(self, request):
        """
        POST /api/users/delete-authority/
        Supprime une autorité (admin seulement).

        Body:
        {
            "username": "..."
        }
        """
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get('username')
        if not username:
            return Response(
                {'detail': 'Username requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)

            # Vérifier que c'est une autorité
            if user.profile.role != 'autorite':
                return Response(
                    {'detail': 'Seules les autorités peuvent être supprimées'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.delete()

            return Response(
                {'detail': f'Autorité {username} supprimée avec succès'},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

    def _generate_otp(self):
        """Génère un code OTP de 6 chiffres"""
        return ''.join(random.choices(string.digits, k=6))

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='verify-otp')
    def verify_otp(self, request):
        """
        POST /api/users/verify-otp/
        Vérifie le code OTP fourni par l'utilisateur.

        Body:
        {
            "username": "...",
            "otp": "000000"
        }
        """
        username = request.data.get('username')
        otp = request.data.get('otp')

        if not username:
            return Response({'detail': 'Nom d\'utilisateur requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp:
            return Response({'detail': 'Code OTP requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
            cache_key = f'otp_{username}'
            stored_otp = cache.get(cache_key)

            if not stored_otp:
                return Response(
                    {'detail': 'Code OTP expiré. Veuillez renvoyer le code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if str(otp) != str(stored_otp):
                return Response(
                    {'detail': 'Code OTP invalide'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # OTP valide : marquer l'utilisateur comme vérifié
            cache.delete(cache_key)
            profile = user.profile
            profile.is_verified = True
            profile.save()

            return Response(
                {
                    'detail': 'Vérification réussie',
                    'user': UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response({'detail': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='resend-otp')
    def resend_otp(self, request):
        """
        POST /api/users/resend-otp/
        Renvoie un nouveau code OTP à l'utilisateur.

        Body:
        {
            "username": "..."
        }
        """
        username = request.data.get('username')

        if not username:
            return Response({'detail': 'Nom d\'utilisateur requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
            otp = self._generate_otp()
            cache_key = f'otp_{username}'
            cache.set(cache_key, otp, timeout=600)  # 10 minutes

            # TODO: En production, envoyer par email ou SMS
            print(f'[DEMO] OTP for {username}: {otp}')

            return Response(
                {'detail': 'Nouveau code OTP envoyé'},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response({'detail': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='authority-stats')
    def authority_stats(self, request):
        """
        GET /api/users/authority-stats/
        Retourne les statistiques de suivi des autorités créées par l'admin.

        Réservé à l'admin.
        """
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Récupérer les autorités créées par cet admin
        authorities = User.objects.filter(
            profile__role='autorite',
            tracking__created_by=request.user
        ).select_related('tracking', 'profile')

        stats_list = []
        for user in authorities:
            tracking = user.tracking if hasattr(user, 'tracking') else None
            stats_list.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'telephone': user.profile.telephone,
                'date_joined': user.date_joined.isoformat(),
                'derniere_connexion': tracking.derniere_connexion.isoformat() if tracking and tracking.derniere_connexion else None,
                'crises_gerees': tracking.crises_gerees if tracking else 0,
                'requetes_traitees': tracking.requetes_traitees if tracking else 0,
                'alertes_envoyees': tracking.alertes_envoyees if tracking else 0,
                'heures_travail': float(tracking.heures_travail) if tracking else 0,
                'premiere_action': tracking.premiere_action.isoformat() if tracking and tracking.premiere_action else None,
            })

        return Response(
            {
                'authorities': stats_list,
                'count': len(stats_list),
                'total_stats': {
                    'crises_gerees': sum(s['crises_gerees'] for s in stats_list),
                    'requetes_traitees': sum(s['requetes_traitees'] for s in stats_list),
                    'alertes_envoyees': sum(s['alertes_envoyees'] for s in stats_list),
                    'heures_travail_total': sum(s['heures_travail'] for s in stats_list),
                }
            },
            status=status.HTTP_200_OK
        )
