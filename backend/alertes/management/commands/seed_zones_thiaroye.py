"""
Commande Django de mise à jour SIG : seed_zones_thiaroye.
Étend la couverture SIG à tout Thiaroye-sur-Mer avec 4 grands secteurs naturels nets :
1. Cuvette Ouest & Historique Inondations (Rouge)
2. Ndakhane & Médina Fass (Orange)
3. Thiaroye Plage & Débarcadère (Orange - arrêté strictement au trait de côte terre ferme lat >= 14.737)
4. Thiaroye Gare & Marché (Jaune)

Génère également le maillage des ruelles navigables (SegmentRue) pour l'évacuation
et les signalements sentinelles vivants aérés 100% sur la terre ferme.

Usage:
    python manage.py seed_zones_thiaroye
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from alertes.models import ZoneRisque, SignalementCitoyen, SegmentRue, PointRefuge

User = get_user_model()


class Command(BaseCommand):
    help = "Alimente et met à jour les 4 zones SIG épurées, les ruelles d'évacuation et les signalements"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initialisation SIG et réseau de ruelles Thiaroye-sur-Mer..."))

        # 1. Nettoyage des anciennes zones pour un découpage net et sans chevauchement marin
        ZoneRisque.objects.all().delete()

        # 2. Définition des 4 grands secteurs naturels de Thiaroye-sur-Mer (terre ferme uniquement)
        zones_data = [
            {
                'quartier': 'Cuvette Ouest (Thiaroye-sur-Mer)',
                'niveau_risque': 'rouge',
                'score_risque_moyen': 0.88,
                'seuil_jaune': 0.35,
                'seuil_orange': 0.55,
                'seuil_rouge': 0.75,
                'description': "Zone basse d'inondation historique (relevés satellites Sentinel et OpenStreetMap). Cuvette réceptrice des eaux pluviales avec stagnation critique.",
                'geom': 'POLYGON((-17.412 14.740, -17.394 14.740, -17.394 14.752, -17.412 14.752, -17.412 14.740))'
            },
            {
                'quartier': 'Ndakhane & Médina Fass',
                'niveau_risque': 'orange',
                'score_risque_moyen': 0.72,
                'seuil_jaune': 0.38,
                'seuil_orange': 0.60,
                'seuil_rouge': 0.80,
                'description': "Dépression résidentielle intermédiaire très dense, caniveaux collecteurs sujets aux obstructions et ruissellement soutenu.",
                'geom': 'POLYGON((-17.394 14.740, -17.372 14.740, -17.372 14.755, -17.394 14.755, -17.394 14.740))'
            },
            {
                'quartier': 'Thiaroye Plage & Débarcadère',
                'niveau_risque': 'orange',
                'score_risque_moyen': 0.65,
                'seuil_jaune': 0.40,
                'seuil_orange': 0.65,
                'seuil_rouge': 0.85,
                'description': "Bande côtière habitée et quai des pirogues (arrêtée strictement au rivage océanique). Concessions exposées aux remontées d'eau.",
                'geom': 'POLYGON((-17.404 14.7430, -17.374 14.7430, -17.374 14.7480, -17.404 14.7480, -17.404 14.7430))'
            },
            {
                'quartier': 'Thiaroye Gare & Marché',
                'niveau_risque': 'jaune',
                'score_risque_moyen': 0.42,
                'seuil_jaune': 0.45,
                'seuil_orange': 0.70,
                'seuil_rouge': 0.88,
                'description': "Plateau commercial et axe ferroviaire surélevé, carrefour de transit et points de refuge hors de portée des grandes eaux.",
                'geom': 'POLYGON((-17.396 14.755, -17.365 14.755, -17.365 14.770, -17.396 14.770, -17.396 14.755))'
            },
        ]

        created_zones = {}
        for zd in zones_data:
            zone = ZoneRisque.objects.create(
                quartier=zd['quartier'],
                niveau_risque=zd['niveau_risque'],
                score_risque_moyen=zd['score_risque_moyen'],
                seuil_jaune=zd['seuil_jaune'],
                seuil_orange=zd['seuil_orange'],
                seuil_rouge=zd['seuil_rouge'],
                description=zd['description'],
                geom=zd['geom'],
            )
            created_zones[zd['quartier']] = zone
            self.stdout.write(self.style.SUCCESS(f"  + Secteur créé : {zone.quartier} ({zone.niveau_risque.upper()})"))

        # 3. Insertion des signalements sentinelles vivants (100% sur la terre ferme, ventilés)
        citoyen_user = User.objects.filter(is_superuser=False).first()
        SignalementCitoyen.objects.all().delete()

        signalements_terre_ferme = [
            # Secteur 1 : Cuvette Ouest (terre ferme)
            {
                'localisation': 'POINT(-17.4055 14.7460)',
                'description': "Stagnation d'eau critique dans la ruelle ouest, niveau d'eau atteignant 40 cm devant les concessions.",
                'categorie': 'inondation',
                'niveau_eau_estime': 'eleve',
                'score_eau_estime': 0.85,
                'valide': True,
            },
            {
                'localisation': 'POINT(-17.3990 14.7435)',
                'description': "Reflux pluvial près du bras d'eau ouest, motopompe communautaire en action.",
                'categorie': 'inondation',
                'niveau_eau_estime': 'modere',
                'score_eau_estime': 0.55,
                'valide': True,
            },
            # Secteur 2 : Ndakhane & Fass
            {
                'localisation': 'POINT(-17.3825 14.7450)',
                'description': "Caniveau collecteur de Ndakhane obstrué par des dépôts sableux, curage bénévole en cours.",
                'categorie': 'egouts',
                'niveau_eau_estime': 'eleve',
                'score_eau_estime': 0.75,
                'valide': True,
            },
            {
                'localisation': 'POINT(-17.3780 14.7480)',
                'description': "Accumulation d'eau devant les habitations de Médina Fass, passage piéton sécurisé par des sacs de sable.",
                'categorie': 'autre',
                'niveau_eau_estime': 'faible',
                'score_eau_estime': 0.35,
                'valide': True,
            },
            # Secteur 3 : Thiaroye Plage & Débarcadère (strictement sur la terre ferme, quai et voie d'accès)
            {
                'localisation': 'POINT(-17.3910 14.7440)',
                'description': "Allée du débarcadère des pêcheurs détrempée par les grandes marées, concessions côtières protégées.",
                'categorie': 'inondation',
                'niveau_eau_estime': 'modere',
                'score_eau_estime': 0.60,
                'valide': True,
            },
            {
                'localisation': 'POINT(-17.3850 14.7445)',
                'description': "Passage sablonneux praticable le long du quai artisanal, reflux marin sous surveillance.",
                'categorie': 'autre',
                'niveau_eau_estime': 'faible',
                'score_eau_estime': 0.30,
                'valide': True,
            },
            # Secteur 4 : Thiaroye Gare
            {
                'localisation': 'POINT(-17.3790 14.7585)',
                'description': "Ruissellement rapide le long de la voie ferroviaire, carrefour commercial dégagé.",
                'categorie': 'autre',
                'niveau_eau_estime': 'faible',
                'score_eau_estime': 0.25,
                'valide': True,
            },
        ]

        for s in signalements_terre_ferme:
            SignalementCitoyen.objects.create(
                localisation=s['localisation'],
                description=s['description'],
                categorie=s['categorie'],
                niveau_eau_estime=s['niveau_eau_estime'],
                score_eau_estime=s['score_eau_estime'],
                valide=s['valide'],
                signale_par=citoyen_user,
            )

        self.stdout.write(self.style.SUCCESS(f"  + {len(signalements_terre_ferme)} signalements créés 100% sur la terre ferme."))

        # 4. Réseau complet de ruelles navigables (SegmentRue) pour l'évacuation vers les lieux sûrs
        SegmentRue.objects.all().delete()

        zone_plage = created_zones['Thiaroye Plage & Débarcadère']
        zone_ndakhane = created_zones['Ndakhane & Médina Fass']
        zone_gare = created_zones['Thiaroye Gare & Marché']
        zone_ouest = created_zones['Cuvette Ouest (Thiaroye-sur-Mer)']

        segments = [
            # Axe Plage -> Ndakhane
            {
                'nom': 'Ruelle des Pêcheurs',
                'geom': 'LINESTRING(-17.3920 14.7435, -17.3880 14.7445, -17.3850 14.7455)',
                'altitude_moyenne': 6.5,
                'pente': 1.2,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.40,
                'zone': zone_plage,
            },
            {
                'nom': 'Avenue de la Plage',
                'geom': 'LINESTRING(-17.3850 14.7435, -17.3850 14.7455)',
                'altitude_moyenne': 7.0,
                'pente': 1.0,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.25,
                'zone': zone_plage,
            },
            # Axe Cuvette Ouest -> Axe de contournement
            {
                'nom': 'Piste d’évacuation de la Cuvette Ouest',
                'geom': 'LINESTRING(-17.4055 14.7460, -17.3990 14.7435, -17.3920 14.7450)',
                'altitude_moyenne': 5.0,
                'pente': 0.8,
                'etat_drainage': 'obstrue',
                'score_risque_actuel': 0.65,
                'zone': zone_ouest,
            },
            {
                'nom': 'Contournement Ouest vers Ndakhane',
                'geom': 'LINESTRING(-17.3920 14.7450, -17.3850 14.7430)',
                'altitude_moyenne': 8.0,
                'pente': 1.5,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.20,
                'zone': zone_ndakhane,
            },
            # Carrefour Ndakhane
            {
                'nom': 'Axe central de Ndakhane',
                'geom': 'LINESTRING(-17.3850 14.7430, -17.3825 14.7450, -17.3800 14.7490)',
                'altitude_moyenne': 9.5,
                'pente': 1.1,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.35,
                'zone': zone_ndakhane,
            },
            # Médina Fass
            {
                'nom': 'Ruelle 14 · Médina Fass',
                'geom': 'LINESTRING(-17.3800 14.7490, -17.3780 14.7520, -17.3780 14.7560)',
                'altitude_moyenne': 11.0,
                'pente': 1.3,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.20,
                'zone': zone_ndakhane,
            },
            # Axe vers les refuges sécurisés (Lycée & Gare)
            {
                'nom': 'Avenue de la Gare (Axe surélevé)',
                'geom': 'LINESTRING(-17.3780 14.7560, -17.3790 14.7585, -17.3789 14.7600)',
                'altitude_moyenne': 15.0,
                'pente': 1.8,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.10,
                'zone': zone_gare,
            },
            {
                'nom': 'Allée sécurisée du Lycée de Thiaroye (Point de refuge)',
                'geom': 'LINESTRING(-17.3789 14.7600, -17.3750 14.7620)',
                'altitude_moyenne': 16.5,
                'pente': 2.0,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.05,
                'zone': zone_gare,
            },
        ]

        for seg in segments:
            SegmentRue.objects.create(
                nom=seg['nom'],
                geom=seg['geom'],
                altitude_moyenne=seg['altitude_moyenne'],
                pente=seg['pente'],
                etat_drainage=seg['etat_drainage'],
                score_risque_actuel=seg['score_risque_actuel'],
                zone=seg['zone'],
            )

        self.stdout.write(self.style.SUCCESS(f"  + {len(segments)} segments de ruelles navigables connectés."))

        # 5. Points de refuge et centres d'accueil d'urgence (PointRefuge)
        PointRefuge.objects.all().delete()
        refuges_data = [
            {
                'nom': 'Lycée Moderne de Thiaroye',
                'type_refuge': 'ecole',
                'localisation': 'POINT(-17.3750 14.7620)',
                'zone': zone_gare,
                'adresse': 'Route de Thiaroye Gare',
                'quartier': 'Thiaroye Gare',
                'capacite': 350,
                'contact': '+221 77 123 45 67',
                'hauteur_etage': 2,
                'notes': 'Bâtiment R+2 surélevé, cour abritée, point de rassemblement prioritaire.',
                'actif': True,
            },
            {
                'nom': 'Grande Mosquée de Ndakhane',
                'type_refuge': 'mosquee',
                'localisation': 'POINT(-17.3820 14.7475)',
                'zone': zone_ndakhane,
                'adresse': 'Rue principale de Ndakhane',
                'quartier': 'Ndakhane',
                'capacite': 200,
                'contact': '+221 78 234 56 78',
                'hauteur_etage': 1,
                'notes': 'Esplanade et grande salle communautaire au sec pour les familles riveraines.',
                'actif': True,
            },
            {
                'nom': 'Centre de Santé de Thiaroye',
                'type_refuge': 'centre_sante',
                'localisation': 'POINT(-17.3775 14.7525)',
                'zone': zone_ndakhane,
                'adresse': 'Avenue Médina Fass',
                'quartier': 'Médina Fass',
                'capacite': 120,
                'contact': '+221 33 834 11 22',
                'hauteur_etage': 1,
                'notes': 'Unité de soins d urgence et accueil médicalisé des personnes vulnérables.',
                'actif': True,
            },
            {
                'nom': 'École Élémentaire Thiaroye 2',
                'type_refuge': 'ecole',
                'localisation': 'POINT(-17.3780 14.7565)',
                'zone': zone_gare,
                'adresse': 'Secteur Minam Gare',
                'quartier': 'Thiaroye Minam',
                'capacite': 250,
                'contact': '+221 77 345 67 89',
                'hauteur_etage': 2,
                'notes': 'Salles de classe à l étage et blocs sanitaires fonctionnels.',
                'actif': True,
            },
            {
                'nom': 'Hôtel de Ville de Thiaroye-sur-Mer',
                'type_refuge': 'mairie',
                'localisation': 'POINT(-17.3785 14.7590)',
                'zone': zone_gare,
                'adresse': 'Place de la Mairie',
                'quartier': 'Thiaroye Gare',
                'capacite': 180,
                'contact': '+221 33 834 00 11',
                'hauteur_etage': 1,
                'notes': 'Poste de commandement de crise, distribution de vivres et secours.',
                'actif': True,
            },
            {
                'nom': 'Foyer Communal de Thiaroye Plage',
                'type_refuge': 'bâtiment_public',
                'localisation': 'POINT(-17.3880 14.7445)',
                'zone': zone_plage,
                'adresse': 'Rue du Débarcadère (Haut de plage)',
                'quartier': 'Thiaroye Plage',
                'capacite': 150,
                'contact': '+221 76 456 78 90',
                'hauteur_etage': 1,
                'notes': 'Refuge de première urgence pour les familles et artisans pêcheurs.',
                'actif': True,
            },
        ]
        for ref in refuges_data:
            PointRefuge.objects.create(**ref)

        self.stdout.write(self.style.SUCCESS(f"  + {len(refuges_data)} points de refuge d'urgence enregistrés."))
        self.stdout.write(self.style.SUCCESS("Mise à jour SIG terminée avec succès. Zéro élément en mer."))
