-- ============================================================================
-- Fonctions PL/pgSQL & Triggers Automatiques — PFE Mbeund-Mi
-- Calcul automatique des scores de risque & Déclenchement d'alertes PostGIS
-- ============================================================================

-- 1. Fonction de calcul du score de risque dynamique pour une Zone Pilote
CREATE OR REPLACE FUNCTION fn_calculer_score_risque_zone(target_zone_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_pluie NUMERIC := 0.0;
    v_obs_count INT := 0;
    v_drain_obstr_count INT := 0;
    v_score_final NUMERIC := 0.0;
BEGIN
    -- Récupérer la précipitation maximale attendue dans les 12 prochaines heures
    SELECT COALESCE(MAX(precipitation), 0.0) INTO v_pluie
    FROM prevision_meteo
    WHERE date_prevision BETWEEN NOW() AND NOW() + INTERVAL '12 hours';

    -- Compter les observations validées situées dans la zone
    SELECT COUNT(o.id) INTO v_obs_count
    FROM observation_terrain o
    JOIN zone_pilote z ON ST_Contains(z.geom, o.geom)
    WHERE z.id = target_zone_id AND o.valide = TRUE;

    -- Compter les segments de rue ayant un état de drainage obstrué
    SELECT COUNT(s.id) INTO v_drain_obstr_count
    FROM segment_rue s
    WHERE s.zone_pilote_id = target_zone_id AND s.etat_drainage IN ('Obstrué', 'Inexistant');

    -- Algorithme de pondération du risque (Pluie: 50%, Drainage: 30%, Signalements: 20%)
    v_score_final := (LEAST(v_pluie, 60.0) / 60.0 * 5.0) 
                   + (LEAST(v_drain_obstr_count * 2.5, 3.0)) 
                   + (LEAST(v_obs_count * 0.6, 2.0));

    -- Borner entre 0.0 et 10.0
    v_score_final := ROUND(LEAST(GREATEST(v_score_final, 0.0), 10.0)::numeric, 2);

    -- Mettre à jour le score dans la table zone_pilote
    UPDATE zone_pilote 
    SET score_risque_moyen = v_score_final 
    WHERE id = target_zone_id;

    -- Archiver dans la table historique_risque
    INSERT INTO historique_risque (type_cible, cible_id, score_risque, date_calcul, details)
    VALUES (
        'ZONE', 
        target_zone_id, 
        v_score_final, 
        NOW(), 
        json_build_object(
            'precipitation_max_mm', v_pluie,
            'observations_count', v_obs_count,
            'segments_obstrues_count', v_drain_obstr_count
        )::jsonb
    );

    RETURN v_score_final;
END;
$$ LANGUAGE plpgsql;


-- 2. Trigger : Recalcul automatique du risque lors de l'ajout d'une nouvelle observation
CREATE OR REPLACE FUNCTION trg_fn_apres_nouvelle_observation()
RETURNS TRIGGER AS $$
DECLARE
    v_zone_id INT;
    v_nouveau_score NUMERIC;
BEGIN
    -- Identifier la zone contenant la nouvelle observation
    SELECT id INTO v_zone_id
    FROM zone_pilote
    WHERE ST_Contains(geom, NEW.geom)
    LIMIT 1;

    IF v_zone_id IS NOT NULL THEN
        -- Recalculer le risque pour cette zone
        v_nouveau_score := fn_calculer_score_risque_zone(v_zone_id);

        -- Si le score dépasse 8.0, émettre automatiquement une alerte ROUGE
        IF v_nouveau_score >= 8.0 THEN
            INSERT INTO alerte (niveau, message, zone_pilote_id, date_emission, date_expiration, statut)
            VALUES (
                'ROUGE',
                'ALERTE CRITIQUE : Seuil de risque dépassé (' || v_nouveau_score || '/10) suite à un nouveau signalement sur le terrain.',
                v_zone_id,
                NOW(),
                NOW() + INTERVAL '24 hours',
                'ACTIVE'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_recalcul_risque ON observation_terrain;
CREATE TRIGGER trg_auto_recalcul_risque
AFTER INSERT ON observation_terrain
FOR EACH ROW
EXECUTE FUNCTION trg_fn_apres_nouvelle_observation();
