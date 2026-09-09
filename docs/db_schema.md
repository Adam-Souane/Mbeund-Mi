# Documentation du Schéma de Base de Données & Dictionnaire des Données

## Plateforme de prévention des inondations — Mbeund-Mi (Dakar, Thiaroye-sur-Mer)

Ce document constitue le dictionnaire technique officiel des données pour la base de données spatio-temporelle **PostgreSQL / PostGIS** du projet Mbeund-Mi.

---

## 🗂️ Dictionnaire des Tables

### 1. Table `utilisateur`
Stocke les comptes des utilisateurs de la plateforme (citoyens, agents de terrain, décideurs et administrateurs).

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant unique de l'utilisateur. |
| `email` | `VARCHAR(150)` | `NOT NULL UNIQUE` | Adresse e-mail de connexion. |
| `mot_de_passe` | `VARCHAR(255)` | `NOT NULL` | Empreinte du mot de passe (Hash bcrypt / Argon2). |
| `nom` | `VARCHAR(100)` | `NOT NULL` | Nom de famille. |
| `prenom` | `VARCHAR(100)` | `NOT NULL` | Prénom. |
| `role` | `VARCHAR(30)` | `CHECK ('CITOYEN','AGENT','ADMINISTRATEUR','DECIDEUR')` | Rôle et privilèges dans l'application. |
| `telephone` | `VARCHAR(20)` | Optionnel | Numéro de téléphone pour alertes SMS. |
| `actif` | `BOOLEAN` | `DEFAULT TRUE` | État du compte. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Date d'inscription. |

---

### 2. Table `zone_pilote`
Délimite les quartiers d'étude de Thiaroye-sur-Mer sujets aux risques d'inondation.

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant unique de la zone. |
| `nom` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Nom officiel du quartier (ex: Ndakhane, Thiaroye Gare). |
| `geom` | `GEOMETRY(Polygon, 4326)` | `NOT NULL` | Emprise polygonale WGS 84 (SRID 4326). |
| `description` | `TEXT` | Optionnel | Description topographique et vulnérabilité. |
| `score_risque_moyen` | `NUMERIC(4,2)` | `CHECK (>=0.0 AND <=10.0)` | Score de risque agrégé (0 = aucun risque, 10 = risque extrême). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Date de création de la zone. |

---

### 3. Table `segment_rue`
Axes routiers, voies de circulation et chenaux de drainage.

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant unique du segment. |
| `nom` | `VARCHAR(150)` | Optionnel | Nom de la rue ou du caniveau collecteur. |
| `geom` | `GEOMETRY(LineString, 4326)` | `NOT NULL` | Tracé linéaire du segment en WGS 84. |
| `altitude_moyenne` | `NUMERIC(5,2)` | Optionnel | Altitude moyenne du segment (en mètres). |
| `pente` | `NUMERIC(4,2)` | Optionnel | Inclinaison en pourcentage. |
| `etat_drainage` | `VARCHAR(50)` | `CHECK ('Bon','Moyen','Obstrué','Inexistant')` | État physique d'évacuation des eaux. |
| `zone_pilote_id` | `INT` | `REFERENCES zone_pilote(id) ON DELETE SET NULL` | Clé étrangère vers la zone parente. |
| `score_risque_actuel` | `NUMERIC(4,2)` | `CHECK (>=0.0 AND <=10.0)` | Score de risque calculé pour ce segment. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Date d'enregistrement du segment. |

---

### 4. Table `observation_terrain`
Signalements ponctuels transmis par les citoyens ou les agents de terrain.

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant unique du signalement. |
| `type_observation` | `VARCHAR(50)` | `CHECK ('Accumulation eau','Obstruction canalisation','Inondation','Autre')` | Catégorie de l'anomalie signalée. |
| `valeur` | `NUMERIC(5,2)` | Optionnel | Hauteur d'eau en cm ou % d'obstruction. |
| `description` | `TEXT` | Optionnel | Commentaire ou remarques du terrain. |
| `geom` | `GEOMETRY(Point, 4326)` | `NOT NULL` | Localisation exacte (GPS WGS 84). |
| `photo_url` | `VARCHAR(255)` | Optionnel | Lien vers la photo justificative stockée. |
| `date_observation` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Date et heure de l'événement. |
| `utilisateur_id` | `INT` | `REFERENCES utilisateur(id) ON DELETE SET NULL` | Identifiant de l'auteur du signalement. |
| `observateur` | `VARCHAR(100)` | Optionnel | Nom textuel si utilisateur non connecté. |
| `valide` | `BOOLEAN` | `DEFAULT TRUE` | Statut de modération du signalement. |

---

### 5. Table `capteur_iot`
Stations de mesure automatiques (capteurs de niveau d'eau et pluviomètres).

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant unique du capteur. |
| `code_identifiant` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Code unique du matériel (ex: SENSOR-TH-01). |
| `type_capteur` | `VARCHAR(30)` | `CHECK ('LIMNIMETRE','PLUVIOMETRE')` | Nature des mesures fournies par le capteur. |
| `geom` | `GEOMETRY(Point, 4326)` | `NOT NULL` | Position géographique de la sonde. |
| `zone_pilote_id` | `INT` | `REFERENCES zone_pilote(id) ON DELETE SET NULL` | Zone d'implantation du capteur. |
| `statut` | `VARCHAR(20)` | `CHECK ('ACTIF','INACTIF','MAINTENANCE')` | État de fonctionnement opérationnel. |
| `dernier_releve` | `TIMESTAMP WITH TIME ZONE` | Optionnel | Timestamp de la dernière transmission. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Date d'installation de l'équipement. |

---

### 6. Table `prevision_meteo`
Prévisions et chroniques pluviométriques.

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant unique de l'enregistrement météo. |
| `date_prevision` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | Date/heure cible de la prévision. |
| `temperature` | `NUMERIC(4,1)` | Optionnel | Température estimée (°C). |
| `precipitation` | `NUMERIC(5,2)` | `NOT NULL` | Précipitations estimées (mm). |
| `vitesse_vent` | `NUMERIC(4,1)` | Optionnel | Vitesse du vent (km/h). |
| `source` | `VARCHAR(100)` | `DEFAULT 'ANACIM'` | Source des données météo. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Horodatage de l'insertion. |

---

### 7. Table `alerte`
Alertes d'inondation diffusées aux autorités et populations.

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant de l'alerte. |
| `niveau` | `VARCHAR(20)` | `CHECK ('JAUNE','ORANGE','ROUGE')` | Niveau de gravité de l'alerte. |
| `message` | `TEXT` | `NOT NULL` | Contenu informatif et consignes. |
| `geom` | `GEOMETRY(Geometry, 4326)` | Optionnel | Zone géographique impactée spécifique. |
| `zone_pilote_id` | `INT` | `REFERENCES zone_pilote(id) ON DELETE SET NULL` | Zone pilote ciblée. |
| `date_emission` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Horodatage d'émission. |
| `date_expiration` | `TIMESTAMP WITH TIME ZONE` | Optionnel | Date de fin de validité de l'alerte. |
| `statut` | `VARCHAR(20)` | `CHECK ('ACTIVE','RESOLUE','ARCHIVEE')` | Statut opérationnel de l'alerte. |

---

### 8. Table `historique_risque`
Série chronologique du suivi des scores de risque pour audit et apprentissage analytique.

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identifiant de l'historique. |
| `type_cible` | `VARCHAR(20)` | `CHECK ('ZONE','SEGMENT')` | Type de l'entité évaluée. |
| `cible_id` | `INT` | `NOT NULL` | ID de la zone pilote ou du segment de rue. |
| `score_risque` | `NUMERIC(4,2)` | `CHECK (>=0.0 AND <=10.0)` | Score attribué lors du calcul. |
| `date_calcul` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Horodatage du calcul. |
| `details` | `JSONB` | Optionnel | Facteurs explicatifs en JSON (ex: pluie, obstruction). |

---

## 🌐 Exemples de Requêtes Géospatiales PostGIS Utiles

### 1. Compter les observations par quartier (Intersection Spatiale)
```sql
SELECT 
    z.nom AS nom_quartier,
    COUNT(o.id) AS total_observations,
    MAX(o.valeur) AS hauteur_eau_max_cm
FROM zone_pilote z
LEFT JOIN observation_terrain o ON ST_Contains(z.geom, o.geom)
GROUP BY z.id, z.nom
ORDER BY total_observations DESC;
```

### 2. Trouver les points d'inondation situés à moins de 200 mètres d'un segment de rue
```sql
SELECT 
    s.nom AS rue_impactee,
    o.type_observation,
    o.valeur AS cm_eau,
    ROUND(ST_Distance(s.geom::geography, o.geom::geography)::numeric, 2) AS distance_metres
FROM segment_rue s
CROSS JOIN observation_terrain o
WHERE ST_DWithin(s.geom::geography, o.geom::geography, 200)
ORDER BY distance_metres ASC;
```

### 3. Calculer la superficie de chaque zone pilote (en hectares)
```sql
SELECT 
    nom,
    ROUND((ST_Area(geom::geography) / 10000.0)::numeric, 2) AS superficie_hectares
FROM zone_pilote;
```

### 4. Générer une zone de danger (Buffer 50m) autour des canalisations obstruées
```sql
SELECT 
    id AS obs_id,
    type_observation,
    ST_Buffer(geom::geography, 50)::geometry AS zone_tampon_danger
FROM observation_terrain
WHERE type_observation = 'Obstruction canalisation';
```
