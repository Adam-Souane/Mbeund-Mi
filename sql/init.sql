-- ============================================================================
-- Base de données : Plateforme de prévention des inondations (Mbeund-Mi)
-- Projet PFE — Thiaroye-sur-Mer, Dakar — 2026
-- Script d'initialisation du schéma et des extensions PostGIS
-- ============================================================================

-- 1. Activation des extensions spatiales PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. Nettoyage préalable (ordre respectant les clés étrangères)
DROP VIEW IF EXISTS vue_observations_par_zone;
DROP TABLE IF EXISTS historique_risque;
DROP TABLE IF EXISTS alerte;
DROP TABLE IF EXISTS prevision_meteo;
DROP TABLE IF EXISTS capteur_iot;
DROP TABLE IF EXISTS observation_terrain;
DROP TABLE IF EXISTS segment_rue;
DROP TABLE IF EXISTS zone_pilote;
DROP TABLE IF EXISTS utilisateur;

-- 3. Table des Utilisateurs (Gestion des rôles et accès)
CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'CITOYEN' CHECK (role IN ('CITOYEN', 'AGENT', 'ADMINISTRATEUR', 'DECIDEUR')),
    telephone VARCHAR(20),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des Zones Pilotes (Quartiers d'étude à Thiaroye-sur-Mer)
CREATE TABLE zone_pilote (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    description TEXT,
    score_risque_moyen NUMERIC(4, 2) DEFAULT 0.0 CHECK (score_risque_moyen >= 0 AND score_risque_moyen <= 10.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des Segments de Rue (avec caractéristiques physiques et topographiques)
CREATE TABLE segment_rue (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(150),
    geom GEOMETRY(LineString, 4326) NOT NULL,
    altitude_moyenne NUMERIC(5, 2), -- altitude moyenne en mètres (topographie)
    pente NUMERIC(4, 2), -- pente en pourcentage
    etat_drainage VARCHAR(50) DEFAULT 'Bon' CHECK (etat_drainage IN ('Bon', 'Moyen', 'Obstrué', 'Inexistant')),
    zone_pilote_id INT REFERENCES zone_pilote(id) ON DELETE SET NULL,
    score_risque_actuel NUMERIC(4, 2) DEFAULT 0.0 CHECK (score_risque_actuel >= 0 AND score_risque_actuel <= 10.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table des Observations Terrain (Signalements d'accumulations d'eau ou d'obstacles)
CREATE TABLE observation_terrain (
    id SERIAL PRIMARY KEY,
    type_observation VARCHAR(50) NOT NULL CHECK (type_observation IN ('Accumulation eau', 'Obstruction canalisation', 'Inondation', 'Autre')),
    valeur NUMERIC(5, 2), -- ex: hauteur d'eau en cm ou % d'obstruction de canalisation
    description TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    photo_url VARCHAR(255),
    date_observation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    utilisateur_id INT REFERENCES utilisateur(id) ON DELETE SET NULL,
    observateur VARCHAR(100),
    valide BOOLEAN DEFAULT TRUE
);

-- 7. Table des Capteurs IoT (Sondes limnimétriques et pluviomètres automatiques)
CREATE TABLE capteur_iot (
    id SERIAL PRIMARY KEY,
    code_identifiant VARCHAR(50) NOT NULL UNIQUE,
    type_capteur VARCHAR(30) NOT NULL CHECK (type_capteur IN ('LIMNIMETRE', 'PLUVIOMETRE')),
    geom GEOMETRY(Point, 4326) NOT NULL,
    zone_pilote_id INT REFERENCES zone_pilote(id) ON DELETE SET NULL,
    statut VARCHAR(20) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'INACTIF', 'MAINTENANCE')),
    dernier_releve TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Table des Prévisions Météo (Séries temporelles de précipitations et températures)
CREATE TABLE prevision_meteo (
    id SERIAL PRIMARY KEY,
    date_prevision TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature NUMERIC(4, 1), -- en degrés Celsius
    precipitation NUMERIC(5, 2) NOT NULL, -- cumul de pluie attendu en mm
    vitesse_vent NUMERIC(4, 1), -- en km/h
    source VARCHAR(100) DEFAULT 'ANACIM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table des Alertes (Diffusion des avertissements sur les zones)
CREATE TABLE alerte (
    id SERIAL PRIMARY KEY,
    niveau VARCHAR(20) NOT NULL CHECK (niveau IN ('JAUNE', 'ORANGE', 'ROUGE')),
    message TEXT NOT NULL,
    geom GEOMETRY(Geometry, 4326), -- géométrie optionnelle d'extension de l'alerte
    zone_pilote_id INT REFERENCES zone_pilote(id) ON DELETE SET NULL,
    date_emission TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_expiration TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) DEFAULT 'ACTIVE' CHECK (statut IN ('ACTIVE', 'RESOLUE', 'ARCHIVEE'))
);

-- 10. Table d'Historique des Risques (Suivi temporel des scores pour l'analyse)
CREATE TABLE historique_risque (
    id SERIAL PRIMARY KEY,
    type_cible VARCHAR(20) NOT NULL CHECK (type_cible IN ('ZONE', 'SEGMENT')),
    cible_id INT NOT NULL, -- ID correspondant à la zone_pilote ou au segment_rue
    score_risque NUMERIC(4, 2) NOT NULL CHECK (score_risque >= 0 AND score_risque <= 10.0),
    date_calcul TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details JSONB -- détails du calcul (ex: poids des précipitations, état du drain)
);

-- ============================================================================
-- Index pour optimiser les performances des requêtes
-- ============================================================================

-- Index Spatiaux (GIST)
CREATE INDEX idx_zone_pilote_geom ON zone_pilote USING GIST (geom);
CREATE INDEX idx_segment_rue_geom ON segment_rue USING GIST (geom);
CREATE INDEX idx_observation_terrain_geom ON observation_terrain USING GIST (geom);
CREATE INDEX idx_capteur_iot_geom ON capteur_iot USING GIST (geom);
CREATE INDEX idx_alerte_geom ON alerte USING GIST (geom);

-- Index Classiques (B-Tree)
CREATE INDEX idx_utilisateur_email ON utilisateur (email);
CREATE INDEX idx_utilisateur_role ON utilisateur (role);
CREATE INDEX idx_segment_rue_zone ON segment_rue (zone_pilote_id);
CREATE INDEX idx_observation_terrain_user ON observation_terrain (utilisateur_id);
CREATE INDEX idx_observation_terrain_date ON observation_terrain (date_observation DESC);
CREATE INDEX idx_capteur_iot_zone ON capteur_iot (zone_pilote_id);
CREATE INDEX idx_prevision_meteo_date ON prevision_meteo (date_prevision DESC);
CREATE INDEX idx_alerte_statut ON alerte (statut);
CREATE INDEX idx_alerte_date_em ON alerte (date_emission DESC);
CREATE INDEX idx_historique_risque_cible ON historique_risque (type_cible, cible_id);
CREATE INDEX idx_historique_risque_date ON historique_risque (date_calcul DESC);

-- ============================================================================
-- Vues Spatiales Utiles
-- ============================================================================

-- Vue associant automatiquement chaque observation à sa zone pilote géospatiale
CREATE OR REPLACE VIEW vue_observations_par_zone AS
SELECT 
    o.id AS observation_id,
    o.type_observation,
    o.valeur,
    o.date_observation,
    o.valide,
    o.utilisateur_id,
    z.id AS zone_pilote_id,
    z.nom AS zone_pilote_nom
FROM observation_terrain o
LEFT JOIN zone_pilote z ON ST_Contains(z.geom, o.geom);
