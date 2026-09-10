import json
import logging
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from capteurs.models import Capteur, Mesure
import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Écoute le broker MQTT (HiveMQ Cloud / Mosquitto) et enregistre les mesures reçues en base de données."

    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            default=None,
            help="Adresse du broker MQTT (par défaut : MOSQUITTO_HOST dans .env)"
        )
        parser.add_argument(
            '--port',
            type=int,
            default=None,
            help="Port du broker MQTT (par défaut : MOSQUITTO_PORT dans .env)"
        )
        parser.add_argument(
            '--topic',
            default='capteurs/+/mesures',
            help='Topic MQTT à écouter (par défaut: capteurs/+/mesures)'
        )
        parser.add_argument(
            '--no-tls',
            action='store_true',
            help="Désactive TLS (broker local non chiffré uniquement, ex: Mosquitto en développement)"
        )

    def handle(self, *args, **options):
        host = options['host'] or settings.MOSQUITTO_HOST
        port = options['port'] or settings.MOSQUITTO_PORT
        topic = options['topic']
        use_tls = not options['no_tls']

        # Configuration du client MQTT avec compatibilité API v1 pour paho-mqtt v2.x et v1.x
        try:
            client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
        except AttributeError:
            client = mqtt.Client()

        # Authentification (requise par les brokers cloud comme HiveMQ Cloud)
        if settings.MQTT_USERNAME:
            client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)

        # TLS (port 8883 standard pour les brokers cloud chiffrés)
        if use_tls:
            client.tls_set()

        # Enregistrement des callbacks
        client.on_connect = self.on_connect
        client.on_disconnect = self.on_disconnect
        client.on_message = self.on_message

        # Stockage du topic pour s'y abonner lors de la connexion
        client.topic_to_subscribe = topic

        self.stdout.write(self.style.SUCCESS(
            f"Connexion au broker MQTT {host}:{port} ({'TLS' if use_tls else 'non chiffré'})..."
        ))

        try:
            # Utilisation de la connexion asynchrone pour permettre au client de tenter
            # de se reconnecter périodiquement même si le broker n'est pas disponible au démarrage.
            client.connect_async(host, port, keepalive=60)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur d'initialisation de la connexion : {e}"))
            return

        try:
            # loop_forever gère automatiquement les reconnexions en tâche de fond
            client.loop_forever(retry_first_connection=True)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Arrêt de la commande d'écoute MQTT par l'utilisateur."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur fatale dans la boucle de messages MQTT: {e}"))

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.stdout.write(self.style.SUCCESS("Connecté au broker MQTT avec succès."))
            topic = getattr(client, 'topic_to_subscribe', 'capteurs/+/mesures')
            client.subscribe(topic)
            self.stdout.write(self.style.SUCCESS(f"Abonné avec succès au topic : {topic}"))
        else:
            self.stderr.write(self.style.ERROR(f"Échec de la connexion au broker MQTT, code de retour : {rc}"))

    def on_disconnect(self, client, userdata, rc):
        self.stderr.write(self.style.WARNING(f"Déconnexion du broker MQTT détectée (code: {rc}). Reconnexion automatique en cours..."))

    def on_message(self, client, userdata, msg):
        payload_str = ""
        try:
            payload_str = msg.payload.decode('utf-8')
            data = json.loads(payload_str)
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            self.stderr.write(self.style.ERROR(f"Message reçu malformé (non JSON) sur {msg.topic}: {e}"))
            logger.error(f"MQTT payload parsing error: {e}")
            return

        # Extraction des champs requis
        capteur_id = data.get('capteur_id')
        valeur_raw = data.get('valeur')
        unite = data.get('unite')
        timestamp_raw = data.get('timestamp')

        # Validation de la présence des champs obligatoires
        if capteur_id is None or valeur_raw is None or unite is None or timestamp_raw is None:
            self.stderr.write(self.style.ERROR(f"Champs obligatoires manquants dans le message : {payload_str}"))
            return

        # Validation de l'existence du capteur
        try:
            capteur = Capteur.objects.get(id=capteur_id)
        except (Capteur.DoesNotExist, ValueError, TypeError):
            self.stderr.write(self.style.ERROR(f"Capteur ID '{capteur_id}' inconnu ou invalide."))
            return

        # Validation et conversion de la valeur
        try:
            valeur = float(valeur_raw)
        except (ValueError, TypeError):
            self.stderr.write(self.style.ERROR(f"Valeur '{valeur_raw}' invalide (doit être numérique)."))
            return

        # Validation et parsing du timestamp
        try:
            timestamp = parse_datetime(str(timestamp_raw))
            if not timestamp:
                self.stderr.write(self.style.ERROR(f"Format de date/heure invalide : '{timestamp_raw}'"))
                return
            if timezone.is_naive(timestamp):
                timestamp = timezone.make_aware(timestamp)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lors du traitement de la date/heure : {e}"))
            return

        # Enregistrement en base de données
        try:
            mesure = Mesure.objects.create(
                capteur=capteur,
                valeur=valeur,
                unite=unite,
                timestamp=timestamp
            )
            self.stdout.write(self.style.SUCCESS(
                f"Mesure enregistrée : Capteur={capteur.nom} (ID={capteur.id}), "
                f"Valeur={valeur} {unite}, Timestamp={timestamp}"
            ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lors de l'enregistrement de la mesure : {e}"))
            logger.exception("Failed to save Mesure to DB")
            return

        # Déclenche l'analyse de risque IA pour la zone du capteur (si rattaché à une zone).
        # Erreur isolée de l'enregistrement ci-dessus : la mesure est déjà sauvegardée,
        # un souci de dispatch Celery (ex: broker indisponible) ne doit pas le masquer.
        if capteur.zone_id:
            try:
                from alertes.tasks import appel_modele_ia
                appel_modele_ia.delay(capteur.zone_id)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Erreur lors du déclenchement de l'analyse IA : {e}"))
                logger.exception("Failed to dispatch appel_modele_ia task")
