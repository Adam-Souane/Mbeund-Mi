from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
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
            "username": "...",
            "email": "...",
            "password": "...",
            "first_name": "...",
            "last_name": "...",
            "telephone": "...",
            "role": "citoyen" ou "autorite"
        }
        """
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        telephone = request.data.get('telephone', '')
        role = request.data.get('role', 'citoyen')

        # Validation
        if not username:
            return Response({'username': 'Nom d\'utilisateur requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({'email': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 8:
            return Response({'password': 'Mot de passe requis (min. 8 caractères)'}, status=status.HTTP_400_BAD_REQUEST)
        if not telephone:
            return Response({'telephone': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier les doublons
        if User.objects.filter(username=username).exists():
            return Response({'username': 'Cet utilisateur existe déjà'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'email': 'Cet email est déjà utilisé'}, status=status.HTTP_400_BAD_REQUEST)

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

                Profile.objects.create(
                    user=user,
                    role=role,
                    telephone=telephone,
                )

            return Response(
                {
                    'detail': 'Compte créé avec succès',
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
