from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from django.core.cache import cache
import random
import string
from .models import Profile
from .serializers import UserSerializer, ProfileSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

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
            "role": "citoyen" ou "autorite"
        }
        """
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        telephone = request.data.get('telephone', '')
        role = request.data.get('role', 'citoyen')

        # Validation
        if not email:
            return Response({'email': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 8:
            return Response({'password': 'Mot de passe requis (min. 8 caractères)'}, status=status.HTTP_400_BAD_REQUEST)
        if not telephone:
            return Response({'telephone': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'email n'existe pas
        if User.objects.filter(email=email).exists():
            return Response({'email': 'Cet email est déjà utilisé'}, status=status.HTTP_400_BAD_REQUEST)

        # Générer un username unique depuis le prénom et nom
        username_base = f"{first_name.lower()}{last_name.lower()}".replace(' ', '')
        username = username_base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{username_base}{counter}"
            counter += 1

        # Créer l'utilisateur et le profil
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                )

                profile = Profile.objects.create(
                    user=user,
                    role=role,
                    telephone=telephone,
                )

                # Générer et stocker un code OTP (seulement pour citoyens)
                otp = None
                if role == 'citoyen':
                    otp = self._generate_otp()
                    cache_key = f'otp_{username}'
                    cache.set(cache_key, otp, timeout=600)  # 10 minutes
                    # TODO: En production, envoyer par email ou SMS
                    print(f'[DEMO] OTP for {username}: {otp}')

            return Response(
                {
                    'detail': 'Compte créé avec succès',
                    'user': UserSerializer(user).data,
                    'requires_otp': role == 'citoyen',
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

        Note: En production, envoyer un email avec un lien de réinitialisation.
        Pour la démo, retourner juste un succès.
        """
        email = request.data.get('email')

        if not email:
            return Response({'detail': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)

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
