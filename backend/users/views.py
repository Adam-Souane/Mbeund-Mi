from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
import secrets
import string
import logging

from django.core.exceptions import ValidationError
from django.core.validators import validate_email

from . import otp
from .models import Profile, InviteCode, AuthorityTracking, AuthorityActivity
from .serializers import UserSerializer

logger = logging.getLogger(__name__)


def _trouver_compte(identifiant):
    """
    Retrouve un compte à partir d'un identifiant, d'un téléphone ou d'un email.
    Renvoie None si aucun compte, ou plusieurs, correspondent (cas d'un numéro
    partagé par deux anciens comptes : l'identifiant permet alors de trancher).
    """
    identifiant = (identifiant or '').strip()
    if not identifiant:
        return None
    if '@' in identifiant:
        candidats = User.objects.filter(email__iexact=identifiant)
    else:
        candidats = User.objects.filter(username=identifiant)
        if not candidats.exists():
            numeros = {identifiant, otp.normaliser_telephone(identifiant)} - {None}
            candidats = User.objects.filter(profile__telephone__in=numeros)
    trouves = list(candidats[:2])
    return trouves[0] if len(trouves) == 1 else None


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

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], authentication_classes=[], url_path='check-username')
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

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], authentication_classes=[], url_path='register')
    def register(self, request):
        """
        POST /api/users/register/
        Inscription publique d'un citoyen. Les comptes autorité et admin sont
        créés uniquement par un administrateur (create-authority, admin-register).

        Body:
        {
            "username": "...", "password": "...",
            "first_name": "...", "last_name": "...",
            "telephone": "...",          # obligatoire : sert aux alertes
            "email": "...",              # facultatif
            "canal_otp": "telephone"     # ou "email" (exige un email)
        }
        """
        email = (request.data.get('email') or '').strip()
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        telephone_saisi = request.data.get('telephone', '')
        username = (request.data.get('username') or '').strip()
        canal_defaut = otp.CANAL_TELEPHONE if otp.sms_disponible() else otp.CANAL_EMAIL
        canal = request.data.get('canal_otp') or canal_defaut

        # Validation
        if not password or len(password) < 8:
            return Response({'password': 'Mot de passe requis (min. 8 caractères)'}, status=status.HTTP_400_BAD_REQUEST)
        if not telephone_saisi:
            return Response({'telephone': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)
        telephone = otp.normaliser_telephone(telephone_saisi)
        if not telephone:
            return Response(
                {'telephone': 'Numéro invalide. Exemple : 77 123 45 67 ou +221 77 123 45 67'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not username:
            return Response({'username': 'Identifiant requis'}, status=status.HTTP_400_BAD_REQUEST)
        if canal not in otp.CANAUX:
            return Response({'canal_otp': 'Canal inconnu : « telephone » ou « email »'}, status=status.HTTP_400_BAD_REQUEST)
        if canal == otp.CANAL_TELEPHONE and not otp.sms_disponible():
            return Response({'canal_otp': "L'envoi par SMS n'est pas encore disponible : utilisez l'email."}, status=status.HTTP_400_BAD_REQUEST)

        # Email facultatif, mais valide et unique s'il est fourni
        if email:
            try:
                validate_email(email)
            except ValidationError:
                return Response({'email': 'Email invalide'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(email__iexact=email).exists():
                return Response({'email': 'Cet email est déjà utilisé'}, status=status.HTTP_400_BAD_REQUEST)
        if canal == otp.CANAL_EMAIL and not email:
            return Response(
                {'canal_otp': 'Renseignez un email pour recevoir le code par email'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response({'username': 'Cet identifiant est déjà pris. Veuillez en choisir un autre.'}, status=status.HTTP_400_BAD_REQUEST)
        # Un numéro = un compte : c'est lui qui reçoit les alertes de la zone
        if Profile.objects.filter(telephone=telephone).exists():
            return Response({'telephone': 'Ce numéro est déjà utilisé par un autre compte'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                )
                # Profil créé par le signal post_save : le rôle n'est jamais lu
                # dans la requête (sinon n'importe qui pourrait s'inscrire admin).
                profile = user.profile
                profile.role = 'citoyen'
                profile.telephone = telephone
                profile.verification_requise = True
                profile.save()
        except Exception:
            logger.exception("Échec de la création du compte %s", username)
            return Response({'detail': 'Impossible de créer le compte. Réessayez.'}, status=status.HTTP_400_BAD_REQUEST)

        code = otp.creer_code(otp.MOTIF_INSCRIPTION, user, canal)
        otp.renvoi_trop_rapide(otp.MOTIF_INSCRIPTION, user)   # démarre le délai de renvoi
        envoye = otp.envoyer_code(user, canal, code, otp.MOTIF_INSCRIPTION)

        return Response(
            {
                'detail': 'Compte créé avec succès',
                'user': UserSerializer(user).data,
                'requires_otp': True,
                'otp': {
                    'canal': canal,
                    'destination': otp.destination(user, canal),
                    'envoye': envoye,
                    'email_disponible': bool(email),
                },
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], authentication_classes=[], url_path='admin-register')
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

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], authentication_classes=[], url_path='password-reset')
    def password_reset(self, request):
        """
        POST /api/users/password-reset/
        Demande un code de réinitialisation du mot de passe.

        Body: {"identifiant": "identifiant, téléphone ou email", "canal": "telephone" | "email"}
        (anciens formats {"telephone": "..."} et {"email": "..."} acceptés)

        La réponse est identique que le compte existe ou non, pour ne pas
        révéler quels numéros ou emails sont inscrits.
        """
        identifiant = (
            request.data.get('identifiant') or request.data.get('telephone') or request.data.get('email') or ''
        ).strip()
        if not identifiant:
            return Response({'detail': 'Identifiant, téléphone ou email requis'}, status=status.HTTP_400_BAD_REQUEST)
        canal = request.data.get('canal') or (otp.CANAL_EMAIL if '@' in identifiant else otp.CANAL_TELEPHONE)
        if canal not in otp.CANAUX:
            return Response({'canal': 'Canal inconnu : « telephone » ou « email »'}, status=status.HTTP_400_BAD_REQUEST)
        if canal == otp.CANAL_TELEPHONE and not otp.sms_disponible():
            return Response({'canal': "L'envoi par SMS n'est pas encore disponible : utilisez l'email."}, status=status.HTTP_400_BAD_REQUEST)

        user = _trouver_compte(identifiant)
        peut_envoyer = (
            user is not None
            and (canal == otp.CANAL_TELEPHONE or bool(user.email))
            and not otp.renvoi_trop_rapide(otp.MOTIF_REINITIALISATION, user)
        )
        if peut_envoyer:
            code = otp.creer_code(otp.MOTIF_REINITIALISATION, user, canal)
            otp.envoyer_code(user, canal, code, otp.MOTIF_REINITIALISATION)

        support = 'par email' if canal == otp.CANAL_EMAIL else 'par SMS'
        return Response(
            {'detail': f'Si un compte correspond, un code vient de vous être envoyé {support}.', 'canal': canal},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], authentication_classes=[], url_path='confirm-password-reset')
    def confirm_password_reset(self, request):
        """
        POST /api/users/confirm-password-reset/
        Vérifie le code et enregistre le nouveau mot de passe.

        Body: {"identifiant": "...", "code": "000000", "new_password": "..."}
        (anciens noms acceptés : "username" et "reset_code")
        """
        identifiant = (request.data.get('identifiant') or request.data.get('username') or '').strip()
        code = request.data.get('code') or request.data.get('reset_code')
        new_password = request.data.get('new_password')

        if not identifiant or not code or not new_password:
            return Response({'detail': 'Identifiant, code et nouveau mot de passe requis'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'detail': 'Mot de passe requis (min. 8 caractères)'}, status=status.HTTP_400_BAD_REQUEST)

        user = _trouver_compte(identifiant)
        resultat = otp.verifier_code(otp.MOTIF_REINITIALISATION, user, code) if user else 'invalide'
        if resultat == 'expire':
            return Response(
                {'detail': 'Code expiré ou trop de tentatives. Faites une nouvelle demande.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if resultat != 'ok':
            return Response({'detail': 'Code invalide'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Mot de passe réinitialisé avec succès'}, status=status.HTTP_200_OK)

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
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

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
        Retourne TOUTES les autorités (pour l'admin).

        Réservé à l'admin.
        """
        # Vérifier que l'utilisateur est admin
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Récupérer TOUTES les autorités
        authorities = User.objects.filter(
            profile__role='autorite'
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
            new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
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
        """Génère un code OTP de 6 chiffres (module secrets)."""
        return otp.generer_code()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], authentication_classes=[], url_path='verify-otp')
    def verify_otp(self, request):
        """
        POST /api/users/verify-otp/
        Vérifie le code reçu à l'inscription et marque le compte comme vérifié.

        Body: {"username": "...", "otp": "000000"}
        """
        username = request.data.get('username')
        code = request.data.get('otp')

        if not username:
            return Response({'detail': 'Nom d\'utilisateur requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not code:
            return Response({'detail': 'Code OTP requis'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(username=username).first()
        if user is None:
            return Response({'detail': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        resultat = otp.verifier_code(otp.MOTIF_INSCRIPTION, user, code)
        if resultat == 'expire':
            return Response(
                {'detail': 'Code expiré ou trop de tentatives. Demandez un nouveau code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if resultat != 'ok':
            return Response({'detail': 'Code OTP invalide'}, status=status.HTTP_400_BAD_REQUEST)

        profile = user.profile
        profile.is_verified = True
        profile.save()
        return Response(
            {'detail': 'Vérification réussie', 'user': UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], authentication_classes=[], url_path='otp-canaux')
    def otp_canaux(self, request):
        """
        GET /api/users/otp-canaux/
        Canaux par lesquels un code peut être envoyé en ce moment, pour que les
        formulaires ne proposent pas le SMS tant qu'aucun fournisseur n'est actif.
        """
        return Response({otp.CANAL_TELEPHONE: otp.sms_disponible(), otp.CANAL_EMAIL: True})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], authentication_classes=[], url_path='resend-otp')
    def resend_otp(self, request):
        """
        POST /api/users/resend-otp/
        Renvoie un code d'inscription, sur le même canal ou sur l'autre.

        Body: {"username": "...", "canal": "telephone" | "email"}  (canal facultatif)
        """
        username = request.data.get('username')
        if not username:
            return Response({'detail': 'Nom d\'utilisateur requis'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(username=username).first()
        if user is None:
            return Response({'detail': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        if user.profile.is_verified:
            return Response({'detail': 'Ce compte est déjà vérifié'}, status=status.HTTP_400_BAD_REQUEST)

        canal = (
            request.data.get('canal')
            or otp.dernier_canal(otp.MOTIF_INSCRIPTION, user)
            or otp.canal_par_defaut(user)
            or otp.CANAL_TELEPHONE
        )
        if canal not in otp.CANAUX:
            return Response({'detail': 'Canal inconnu : « telephone » ou « email »'}, status=status.HTTP_400_BAD_REQUEST)
        if canal == otp.CANAL_TELEPHONE and not otp.sms_disponible():
            return Response(
                {'detail': "L'envoi par SMS n'est pas encore disponible : utilisez l'email."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if canal == otp.CANAL_EMAIL and not user.email:
            return Response({'detail': 'Aucun email associé à ce compte'}, status=status.HTTP_400_BAD_REQUEST)
        if otp.renvoi_trop_rapide(otp.MOTIF_INSCRIPTION, user):
            return Response(
                {'detail': f'Patientez {otp.DELAI_RENVOI} secondes avant de demander un nouveau code'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        code = otp.creer_code(otp.MOTIF_INSCRIPTION, user, canal)
        envoye = otp.envoyer_code(user, canal, code, otp.MOTIF_INSCRIPTION)
        support = 'par email' if canal == otp.CANAL_EMAIL else 'par SMS'
        return Response(
            {
                'detail': f'Nouveau code envoyé {support}' if envoye else "L'envoi a échoué, réessayez dans une minute",
                'canal': canal,
                'destination': otp.destination(user, canal),
                'envoye': envoye,
            },
            status=status.HTTP_200_OK if envoye else status.HTTP_502_BAD_GATEWAY,
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='authority-stats')
    def authority_stats(self, request):
        """
        GET /api/users/authority-stats/
        Retourne les statistiques de suivi de TOUTES les autorités.

        Réservé à l'admin.
        """
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Récupérer TOUTES les autorités (indépendamment de qui les a créées)
        authorities = User.objects.filter(
            profile__role='autorite'
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='authority-activities/(?P<user_id>[0-9]+)')
    def authority_activities(self, request, user_id=None):
        """
        GET /api/users/authority-activities/{user_id}/
        Retourne l'historique des activités d'une autorité.

        Réservé à l'admin.
        """
        if request.user.profile.role != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            authority = User.objects.get(id=user_id, profile__role='autorite')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Autorité non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Récupérer les 50 dernières activités
        activities = AuthorityActivity.objects.filter(authority=authority)[:50]

        activities_list = [
            {
                'id': act.id,
                'action_type': act.action_type,
                'action_label': act.get_action_type_display(),
                'description': act.description,
                'zone': act.zone,
                'timestamp': act.timestamp.isoformat(),
            }
            for act in activities
        ]

        return Response(
            {
                'authority': {
                    'id': authority.id,
                    'username': authority.username,
                    'first_name': authority.first_name,
                    'last_name': authority.last_name,
                },
                'activities': activities_list,
                'count': len(activities_list),
            },
            status=status.HTTP_200_OK
        )
