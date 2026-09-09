-- ============================================================================
-- Données de test (Seeds) : Plateforme de prévention des inondations (Mbeund-Mi)
-- Emplacements réels et coordonnées dans la zone de Thiaroye, Dakar, Sénégal
-- Système de référence de coordonnées : WGS 84 (SRID 4326)
-- ============================================================================

-- Désactiver temporairement les triggers pour simplifier l'insertion si nécessaire
SET session_replication_role = 'replica';

-- Vider les tables au cas où
TRUNCATE historique_risque, alerte, prevision_meteo, capteur_iot, observation_terrain, segment_rue, zone_pilote, utilisateur RESTART IDENTITY CASCADE;

-- 1. Données pour 'utilisateur' (Comptes de démonstration)
INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, role, telephone)
VALUES
(
    'admin@mbeund-mi.sn',
    '$2b$12$e8YkZ7nF...hash_fictif_admin',
    'Ndiaye',
    'Ousmane',
    'ADMINISTRATEUR',
    '+221770000001'
),
(
    'agent.diop@mbeund-mi.sn',
    '$2b$12$e8YkZ7nF...hash_fictif_agent',
    'Diop',
    'Amadou',
    'AGENT',
    '+221770000002'
),
(
    'fatimata.diallo@gmail.com',
    '$2b$12$e8YkZ7nF...hash_fictif_citoyen',
    'Diallo',
    'Fatimata',
    'CITOYEN',
    '+221770000003'
),
(
    'maire.thiaroye@dakar.sn',
    '$2b$12$e8YkZ7nF...hash_fictif_decideur',
    'Sow',
    'Moussa',
    'DECIDEUR',
    '+221770000004'
);

-- 2. Données pour 'zone_pilote' (Polygones délimitant les quartiers cibles)
INSERT INTO zone_pilote (nom, geom, description, score_risque_moyen)
VALUES 
(
    'Thiaroye Gare', 
    ST_GeomFromText('POLYGON((-17.385 14.745, -17.375 14.745, -17.375 14.755, -17.385 14.755, -17.385 14.745))', 4326),
    'Zone fortement urbanisée et commerciale autour de la gare ferroviaire, sensible au ruissellement.',
    6.50
),
(
    'Ndakhane', 
    ST_GeomFromText('POLYGON((-17.380 14.735, -17.370 14.735, -17.370 14.745, -17.380 14.745, -17.380 14.735))', 4326),
    'Quartier résidentiel avec de nombreuses cuvettes topographiques naturelles propices aux stagnations d''eau.',
    7.20
),
(
    'Thiaroye-sur-Mer', 
    ST_GeomFromText('POLYGON((-17.395 14.725, -17.380 14.725, -17.380 14.735, -17.395 14.735, -17.395 14.725))', 4326),
    'Zone côtière soumise à la fois aux risques de ruissellement pluvial et aux remontées de nappe phréatique.',
    5.80
);

-- 3. Données pour 'segment_rue' (LineStrings représentant les axes de drainage principaux)
INSERT INTO segment_rue (nom, geom, altitude_moyenne, pente, etat_drainage, zone_pilote_id, score_risque_actuel)
VALUES
(
    'Route de Rufisque - Segment Gare',
    ST_GeomFromText('LINESTRING(-17.384 14.746, -17.380 14.748, -17.376 14.750)', 4326),
    12.40,
    1.20,
    'Moyen',
    1, -- Thiaroye Gare
    6.80
),
(
    'Caniveau collecteur de Ndakhane',
    ST_GeomFromText('LINESTRING(-17.378 14.738, -17.374 14.741, -17.372 14.743)', 4326),
    8.10,
    0.40,
    'Obstrué',
    2, -- Ndakhane
    8.50
),
(
    'Avenue de la Plage',
    ST_GeomFromText('LINESTRING(-17.390 14.728, -17.386 14.731, -17.382 14.734)', 4326),
    4.50,
    2.10,
    'Bon',
    3, -- Thiaroye-sur-Mer
    4.10
);

-- 4. Données pour 'observation_terrain' (Points géographiques signalant des événements)
INSERT INTO observation_terrain (type_observation, valeur, description, geom, photo_url, date_observation, utilisateur_id, observateur, valide)
VALUES
(
    'Accumulation eau',
    35.00,
    'Stagnation d''eau importante gênant la circulation des piétons devant la pharmacie.',
    ST_GeomFromText('POINT(-17.382 14.747)', 4326),
    'https://images.mbeund-mi.sn/obs/obs_1092.jpg',
    NOW() - INTERVAL '2 hours',
    2, -- Amadou Diop (Agent)
    'Amadou Diop (Agent)',
    TRUE
),
(
    'Obstruction canalisation',
    80.00,
    'Caniveau principal rempli d''ordures ménagères empêchant l''évacuation des eaux de pluie.',
    ST_GeomFromText('POINT(-17.376 14.740)', 4326),
    'https://images.mbeund-mi.sn/obs/obs_2048.jpg',
    NOW() - INTERVAL '1 day',
    3, -- Fatimata Diallo (Citoyenne)
    'Fatimata Diallo (Citoyenne)',
    TRUE
),
(
    'Inondation',
    60.00,
    'Inondation totale de la chaussée basse suite à l''orage de la nuit dernière.',
    ST_GeomFromText('POINT(-17.388 14.729)', 4326),
    'https://images.mbeund-mi.sn/obs/obs_3012.jpg',
    NOW() - INTERVAL '3 hours',
    4, -- Moussa Sow (Volontaire)
    'Moussa Sow (Volontaire)',
    TRUE
);

-- 5. Données pour 'capteur_iot' (Capteurs automatiques de télémesure)
INSERT INTO capteur_iot (code_identifiant, type_capteur, geom, zone_pilote_id, statut, dernier_releve)
VALUES
(
    'LIMNO-NDAKHANE-01',
    'LIMNIMETRE',
    ST_GeomFromText('POINT(-17.375 14.739)', 4326),
    2, -- Ndakhane
    'ACTIF',
    NOW() - INTERVAL '10 minutes'
),
(
    'PLUVIO-GARE-01',
    'PLUVIOMETRE',
    ST_GeomFromText('POINT(-17.381 14.749)', 4326),
    1, -- Thiaroye Gare
    'ACTIF',
    NOW() - INTERVAL '15 minutes'
);

-- 6. Données pour 'prevision_meteo' (Séries temporelles météo)
INSERT INTO prevision_meteo (date_prevision, temperature, precipitation, vitesse_vent, source)
VALUES
(NOW() + INTERVAL '2 hours', 30.5, 12.50, 18.2, 'ANACIM'),
(NOW() + INTERVAL '6 hours', 28.0, 48.00, 25.0, 'ANACIM'), -- Forte précipitation attendue
(NOW() + INTERVAL '12 hours', 26.5, 8.20, 15.0, 'ANACIM'),
(NOW() + INTERVAL '24 hours', 29.0, 0.00, 12.0, 'OpenWeather'),
(NOW() + INTERVAL '48 hours', 31.0, 0.00, 14.5, 'OpenWeather');

-- 7. Données pour 'alerte' (Alerte spatio-temporelle active)
INSERT INTO alerte (niveau, message, geom, zone_pilote_id, date_emission, date_expiration, statut)
VALUES
(
    'ORANGE',
    'Risque fort d''inondation dans le secteur de Ndakhane. Fortes pluies attendues dans les prochaines heures. Canaux obstrués détectés à proximité.',
    ST_GeomFromText('POLYGON((-17.380 14.735, -17.370 14.735, -17.370 14.745, -17.380 14.745, -17.380 14.735))', 4326),
    2, -- Ndakhane
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '12 hours',
    'ACTIVE'
);

-- 8. Données pour 'historique_risque' (Suivi temporel des scores)
INSERT INTO historique_risque (type_cible, cible_id, score_risque, date_calcul, details)
VALUES
('ZONE', 1, 6.20, NOW() - INTERVAL '2 days', '{"cause": "pluie faible, drainage moyen"}'),
('ZONE', 1, 6.50, NOW() - INTERVAL '1 day', '{"cause": "nouvelle pluie et accumulation d''eau signalée"}'),
('ZONE', 2, 5.10, NOW() - INTERVAL '3 days', '{"cause": "stable"}'),
('ZONE', 2, 7.20, NOW(), '{"cause": "fortes pluies annoncées (48mm) + obstruction de caniveau à 80%"}'),
('SEGMENT', 2, 8.50, NOW(), '{"cause": "obstruction majeure et topographie en cuvette"}');

-- Réactiver les triggers
SET session_replication_role = 'origin';
