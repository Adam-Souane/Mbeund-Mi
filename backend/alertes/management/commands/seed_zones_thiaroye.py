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
            # ── 1. Thiaroye Plage & Débarcadère (Littoral / Sud) ──
            {
                'nom': 'Boulevard Front de Mer (Plage Thiaroye)',
                'geom': 'LINESTRING(-17.3950 14.7410, -17.3910 14.7420, -17.3850 14.7435)',
                'altitude_moyenne': 4.5,
                'pente': 0.8,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.45,
                'zone': zone_plage,
            },
            {
                'nom': 'Ruelle des Pêcheurs (Axe Débarcadère)',
                'geom': 'LINESTRING(-17.3920 14.7435, -17.3880 14.7445, -17.3850 14.7455)',
                'altitude_moyenne': 6.5,
                'pente': 1.2,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.40,
                'zone': zone_plage,
            },
            {
                'nom': 'Avenue de la Plage',
                'geom': 'LINESTRING(-17.3850 14.7435, -17.3850 14.7470)',
                'altitude_moyenne': 7.0,
                'pente': 1.0,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.25,
                'zone': zone_plage,
            },
            {
                'nom': 'Ruelle des Mareyeurs et Fumoirs',
                'geom': 'LINESTRING(-17.3910 14.7420, -17.3880 14.7445)',
                'altitude_moyenne': 5.2,
                'pente': 1.1,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.38,
                'zone': zone_plage,
            },
            {
                'nom': 'Rue de la Grande Mosquée de Thiaroye Plage',
                'geom': 'LINESTRING(-17.3850 14.7455, -17.3810 14.7440, -17.3780 14.7445)',
                'altitude_moyenne': 6.8,
                'pente': 0.9,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.22,
                'zone': zone_plage,
            },

            # ── 2. Cuvette Ouest (Thiaroye-sur-Mer) ──
            {
                'nom': 'Piste d’évacuation de la Cuvette Ouest',
                'geom': 'LINESTRING(-17.4080 14.7470, -17.4020 14.7455, -17.3950 14.7445)',
                'altitude_moyenne': 5.0,
                'pente': 0.8,
                'etat_drainage': 'obstrue',
                'score_risque_actuel': 0.70,
                'zone': zone_ouest,
            },
            {
                'nom': 'Boulevard de Contournement Ouest',
                'geom': 'LINESTRING(-17.3950 14.7445, -17.3900 14.7460, -17.3850 14.7470)',
                'altitude_moyenne': 8.0,
                'pente': 1.5,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.20,
                'zone': zone_ouest,
            },
            {
                'nom': 'Voie de délestage des eaux pluviales (Cuvette)',
                'geom': 'LINESTRING(-17.4050 14.7490, -17.3990 14.7470, -17.3950 14.7445)',
                'altitude_moyenne': 5.8,
                'pente': 0.7,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.55,
                'zone': zone_ouest,
            },
            {
                'nom': 'Rue du Bassin de Rétention Ouest',
                'geom': 'LINESTRING(-17.4020 14.7455, -17.4030 14.7420, -17.3950 14.7410)',
                'altitude_moyenne': 4.8,
                'pente': 0.6,
                'etat_drainage': 'obstrue',
                'score_risque_actuel': 0.65,
                'zone': zone_ouest,
            },

            # ── 3. Ndakhane & Médina Fass (Centre dense / Résidentiel) ──
            {
                'nom': 'Axe central de Ndakhane',
                'geom': 'LINESTRING(-17.3850 14.7470, -17.3825 14.7495, -17.3800 14.7520)',
                'altitude_moyenne': 9.5,
                'pente': 1.1,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.35,
                'zone': zone_ndakhane,
            },
            {
                'nom': 'Rue Principale de Ndakhane (Collecteur)',
                'geom': 'LINESTRING(-17.3900 14.7460, -17.3850 14.7470, -17.3800 14.7475)',
                'altitude_moyenne': 8.8,
                'pente': 1.2,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.28,
                'zone': zone_ndakhane,
            },
            {
                'nom': 'Ruelle des Artisans (Ndakhane)',
                'geom': 'LINESTRING(-17.3825 14.7495, -17.3860 14.7520, -17.3850 14.7550)',
                'altitude_moyenne': 9.0,
                'pente': 1.0,
                'etat_drainage': 'moyen',
                'score_risque_actuel': 0.32,
                'zone': zone_ndakhane,
            },
            {
                'nom': 'Ruelle 14 · Médina Fass',
                'geom': 'LINESTRING(-17.3800 14.7520, -17.3780 14.7545, -17.3780 14.7570)',
                'altitude_moyenne': 11.0,
                'pente': 1.3,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.20,
                'zone': zone_ndakhane,
            },
            {
                'nom': 'Traverse Ndakhane vers Fass',
                'geom': 'LINESTRING(-17.3850 14.7510, -17.3825 14.7515, -17.3800 14.7520)',
                'altitude_moyenne': 10.2,
                'pente': 1.1,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.18,
                'zone': zone_ndakhane,
            },
            {
                'nom': 'Rue de l’École Primaire de Ndakhane',
                'geom': 'LINESTRING(-17.3800 14.7475, -17.3780 14.7495, -17.3800 14.7520)',
                'altitude_moyenne': 10.5,
                'pente': 1.4,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.15,
                'zone': zone_ndakhane,
            },
            {
                'nom': 'Ruelle du Poste de Santé de Fass',
                'geom': 'LINESTRING(-17.3780 14.7545, -17.3745 14.7540)',
                'altitude_moyenne': 11.5,
                'pente': 1.2,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.12,
                'zone': zone_ndakhane,
            },

            # ── 4. Thiaroye Gare & Marché (Axe surélevé / Refuges / Pôle d'échange) ──
            {
                'nom': 'Avenue de la Gare (Axe surélevé)',
                'geom': 'LINESTRING(-17.3780 14.7570, -17.3785 14.7595, -17.3770 14.7620)',
                'altitude_moyenne': 15.0,
                'pente': 1.8,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.10,
                'zone': zone_gare,
            },
            {
                'nom': 'Rue du Marché Central de Thiaroye',
                'geom': 'LINESTRING(-17.3830 14.7580, -17.3785 14.7595, -17.3740 14.7605)',
                'altitude_moyenne': 14.2,
                'pente': 1.5,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.15,
                'zone': zone_gare,
            },
            {
                'nom': 'Tally Diallo (Axe structurant vers RN1)',
                'geom': 'LINESTRING(-17.3770 14.7620, -17.3730 14.7650, -17.3690 14.7680)',
                'altitude_moyenne': 16.0,
                'pente': 1.6,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.08,
                'zone': zone_gare,
            },
            {
                'nom': 'Allée sécurisée du Lycée de Thiaroye (Point de refuge)',
                'geom': 'LINESTRING(-17.3770 14.7620, -17.3735 14.7635)',
                'altitude_moyenne': 16.5,
                'pente': 2.0,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.05,
                'zone': zone_gare,
            },
            {
                'nom': 'Voie d’accès à la Gare Ferroviaire TER',
                'geom': 'LINESTRING(-17.3785 14.7595, -17.3805 14.7625, -17.3810 14.7650)',
                'altitude_moyenne': 14.8,
                'pente': 1.4,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.09,
                'zone': zone_gare,
            },
            {
                'nom': 'Rue de la Mairie de Thiaroye-sur-Mer',
                'geom': 'LINESTRING(-17.3740 14.7605, -17.3715 14.7625, -17.3735 14.7635)',
                'altitude_moyenne': 15.5,
                'pente': 1.7,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.07,
                'zone': zone_gare,
            },
            {
                'nom': 'Rue de l’Hôpital Militaire & Camp Thiaroye',
                'geom': 'LINESTRING(-17.3830 14.7580, -17.3850 14.7550, -17.3870 14.7530)',
                'altitude_moyenne': 13.0,
                'pente': 1.3,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.12,
                'zone': zone_gare,
            },
            {
                'nom': 'Axe Traversier Sam Sam · Tally Diallo',
                'geom': 'LINESTRING(-17.3740 14.7605, -17.3710 14.7585, -17.3680 14.7565)',
                'altitude_moyenne': 13.8,
                'pente': 1.4,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.14,
                'zone': zone_gare,
            },
            {
                'nom': 'Ruelle de liaison Guinaw Rail Sud',
                'geom': 'LINESTRING(-17.3690 14.7680, -17.3650 14.7670, -17.3620 14.7650)',
                'altitude_moyenne': 15.2,
                'pente': 1.5,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.10,
                'zone': zone_gare,
            },
            {
                'nom': 'Voie des Canaux ONAS & Station de Pompage',
                'geom': 'LINESTRING(-17.3680 14.7565, -17.3660 14.7595, -17.3690 14.7680)',
                'altitude_moyenne': 14.5,
                'pente': 1.3,
                'etat_drainage': 'bon',
                'score_risque_actuel': 0.11,
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
