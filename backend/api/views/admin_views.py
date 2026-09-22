"""
Endpoints API pour l'administration générale (Super Admin)
- Gestion des autorités
- Suivi de leur activité
- Statistiques de travail
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Q, Count, Sum, Avg, F
from django.utils import timezone
from datetime import timedelta
from alertes.models import ActivityLog, CrisisManagement, Alerte
from api.models import Profile
import logging

logger = logging.getLogger(__name__)


def is_super_admin(user):
    """Vérifier si l'utilisateur est super admin"""
    if not user.is_authenticated:
        return False
    try:
        return user.profile.role == 'admin' and user.is_staff
    except:
        return False


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_authorities(request):
    """
    Liste toutes les autorités créées par le super admin

    Query params:
        - search: Rechercher par nom/email
        - sort: 'name', 'crises', 'hours', 'activity'
        - limit: Nombre de résultats (défaut: 50)

    Retourne: [{id, username, email, role, crises_count, hours_worked, last_activity, alerts_sent}]
    """
    if not is_super_admin(request.user):
        return Response(
            {'error': 'Permission denied. Super admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        # Récupérer les autorités (admin et agent)
        authorities = User.objects.filter(
            profile__role__in=['admin', 'agent']
        ).select_related('profile').prefetch_related(
            'activity_logs', 'crisis_management', 'alertes'
        )

        # Recherche
        search = request.query_params.get('search', '').strip()
        if search:
            authorities = authorities.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        # Compter les crises par autorité
        authorities_data = []
        for authority in authorities:
            crises = CrisisManagement.objects.filter(authority=authority)
            total_hours = crises.aggregate(Sum('hours_worked'))['hours_worked__sum'] or 0
            active_crises = crises.filter(status='ongoing').count()
            alerts_sent = Alerte.objects.filter(timestamp__gte=timezone.now() - timedelta(days=7)).count()

            # Dernière activité
            last_activity = ActivityLog.objects.filter(authority=authority).latest('timestamp')
            last_activity_time = last_activity.timestamp if last_activity else None

            authorities_data.append({
                'id': authority.id,
                'username': authority.username,
                'email': authority.email,
                'full_name': f"{authority.first_name} {authority.last_name}".strip(),
                'role': authority.profile.role if hasattr(authority, 'profile') else 'unknown',
                'is_active': authority.is_active,
                'crises_count': crises.count(),
                'active_crises': active_crises,
                'hours_worked': float(total_hours),
                'alerts_sent': alerts_sent,
                'last_activity': last_activity_time.isoformat() if last_activity_time else None,
                'joined_date': authority.date_joined.isoformat(),
            })

        # Tri
        sort_by = request.query_params.get('sort', 'name')
        if sort_by == 'crises':
            authorities_data.sort(key=lambda x: x['crises_count'], reverse=True)
        elif sort_by == 'hours':
            authorities_data.sort(key=lambda x: x['hours_worked'], reverse=True)
        elif sort_by == 'activity':
            authorities_data.sort(key=lambda x: x['last_activity'] or '', reverse=True)
        else:
            authorities_data.sort(key=lambda x: x['username'])

        # Pagination
        limit = int(request.query_params.get('limit', 50))
        data = authorities_data[:limit]

        return Response({
            'count': len(authorities_data),
            'results': data
        })

    except Exception as e:
        logger.error(f"Erreur list_authorities: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def authority_activity(request, authority_id):
    """
    Récupère l'activité détaillée d'une autorité

    Retourne: {
        authority: {...},
        activities: [{action_type, description, timestamp, metadata}],
        pagination: {count, page, total_pages}
    }
    """
    if not is_super_admin(request.user):
        return Response(
            {'error': 'Permission denied. Super admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        # Vérifier que l'autorité existe
        authority = User.objects.get(id=authority_id, profile__role__in=['admin', 'agent'])

        # Récupérer les logs d'activité
        activities = ActivityLog.objects.filter(authority=authority).order_by('-timestamp')

        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        start = (page - 1) * limit
        end = start + limit

        total_count = activities.count()
        total_pages = (total_count + limit - 1) // limit

        activities_page = activities[start:end]

        activities_data = [{
            'id': act.id,
            'action_type': act.get_action_type_display(),
            'description': act.description,
            'timestamp': act.timestamp.isoformat(),
            'metadata': act.metadata,
        } for act in activities_page]

        return Response({
            'authority': {
                'id': authority.id,
                'username': authority.username,
                'email': authority.email,
                'full_name': f"{authority.first_name} {authority.last_name}".strip(),
            },
            'activities': activities_data,
            'pagination': {
                'count': len(activities_data),
                'page': page,
                'limit': limit,
                'total_count': total_count,
                'total_pages': total_pages,
            }
        })

    except User.DoesNotExist:
        return Response(
            {'error': 'Authority not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Erreur authority_activity: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def authority_stats(request, authority_id):
    """
    Récupère les statistiques de travail d'une autorité

    Retourne: {
        authority: {...},
        stats: {
            crises_total: 15,
            crises_resolved: 13,
            crises_ongoing: 2,
            hours_worked: 48.5,
            hours_avg_per_crisis: 3.2,
            alerts_sent: 45,
            sms_sent: 120,
            push_sent: 89,
            avg_response_time_minutes: 15,
            last_7_days_activity: 5 actions
        }
    }
    """
    if not is_super_admin(request.user):
        return Response(
            {'error': 'Permission denied. Super admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        authority = User.objects.get(id=authority_id, profile__role__in=['admin', 'agent'])

        # Crises
        crises = CrisisManagement.objects.filter(authority=authority)
        crises_total = crises.count()
        crises_resolved = crises.filter(status='resolved').count()
        crises_ongoing = crises.filter(status='ongoing').count()

        # Heures de travail
        total_hours = crises.aggregate(Sum('hours_worked'))['hours_worked__sum'] or 0
        avg_hours_per_crisis = total_hours / crises_total if crises_total > 0 else 0

        # Alertes
        alerts = Alerte.objects.filter(timestamp__gte=timezone.now() - timedelta(days=7))
        alerts_sent = alerts.count()

        # SMS et Push (depuis ActivityLog)
        activities = ActivityLog.objects.filter(authority=authority)
        sms_sent = activities.filter(action_type='sms_sent').count()
        push_sent = activities.filter(action_type='push_sent').count()

        # Activité dernière semaine
        week_ago = timezone.now() - timedelta(days=7)
        last_week_activities = activities.filter(timestamp__gte=week_ago).count()

        # Temps de réponse moyen (si données disponibles)
        avg_response_time = 0  # À implémenter si besoin

        return Response({
            'authority': {
                'id': authority.id,
                'username': authority.username,
                'email': authority.email,
                'full_name': f"{authority.first_name} {authority.last_name}".strip(),
            },
            'stats': {
                'crises_total': crises_total,
                'crises_resolved': crises_resolved,
                'crises_ongoing': crises_ongoing,
                'hours_worked': float(total_hours),
                'hours_avg_per_crisis': float(avg_hours_per_crisis),
                'alerts_sent': alerts_sent,
                'sms_sent': sms_sent,
                'push_sent': push_sent,
                'avg_response_time_minutes': avg_response_time,
                'last_7_days_activity': last_week_activities,
                'last_activity': activities.latest('timestamp').timestamp.isoformat() if activities.exists() else None,
            }
        })

    except User.DoesNotExist:
        return Response(
            {'error': 'Authority not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Erreur authority_stats: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_activity(request):
    """
    Endpoint interne pour logger une activité d'autorité
    Utilisé par d'autres services pour tracker les actions

    Body:
    {
        "authority_id": 123,
        "action_type": "alert_created",
        "description": "Alerte créée pour Zone A",
        "metadata": {"zone_id": 5, "level": "orange"}
    }
    """
    try:
        data = request.data

        authority = User.objects.get(id=data.get('authority_id'))
        action_type = data.get('action_type', 'other')
        description = data.get('description', '')
        metadata = data.get('metadata', {})

        ActivityLog.objects.create(
            authority=authority,
            action_type=action_type,
            description=description,
            metadata=metadata,
            ip_address=request.META.get('REMOTE_ADDR', '')
        )

        return Response({'success': True}, status=status.HTTP_201_CREATED)

    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Erreur log_activity: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
