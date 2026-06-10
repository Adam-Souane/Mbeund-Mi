QUARTIERS = {
    1: 'Thiaroye-Gare',
    2: 'Wakhinane',
    3: 'Diamaguène',
    4: 'Thiaroye-Mer',
    5: 'Zone Industrielle'
}

POINTS_RASSEMBLEMENT = {
    1: 'École Thierno Sall',
    2: 'Mosquée Serigne Mbacké',
    3: 'Centre de santé Diamaguène',
    4: 'Lycée de Thiaroye',
    5: 'Mairie de Thiaroye'
}

TEMPLATES = {
    'vert': {
        'fr': 'Situation normale à {quartier}. Surveillance maintenue.',
        'wo': 'Liñu gis ci {quartier} jàmm la. Ñu ngi ciy bayyi xel.'
    },
    'jaune': {
        'fr': 'Vigilance recommandée à {quartier}. Montée prévue à {niveau}cm dans {horizon}h.',
        'wo': 'Ñu ngi sàkku ngeen bayyi xel bu baax ci {quartier}. Ndox mi dina yéeg ba {niveau}cm ci {horizon} waxtu.'
    },
    'orange': {
        'fr': "Préparez l'évacuation de {quartier}. Niveau critique prévu à {niveau}cm dans {horizon}h.",
        'wo': 'Wajal leen génn ci {quartier}. Ndox mi dina yéeg lool ba {niveau}cm ci {horizon} waxtu.'
    },
    'rouge': {
        'fr': 'ÉVACUATION IMMÉDIATE de {quartier} ! Niveau dangereux : {niveau}cm. Rejoignez {point_rassemblement}.',
        'wo': 'GÉNN LEEN LÉEGI LÉEGI ci {quartier}! Ndox mi bare na lool: {niveau}cm. Dem leen {point_rassemblement}.'
    }
}

def generer_recommandation(zone_id, risque, niveau_cm, horizon_h):
    """Génère les recommandations en français et en wolof."""
    quartier = QUARTIERS.get(zone_id, f"Zone {zone_id}")
    point_rassemblement = POINTS_RASSEMBLEMENT.get(zone_id, "Lieu sécurisé")
    
    risque_key = risque.lower()
    if risque_key not in TEMPLATES:
        risque_key = 'vert'
        
    template_fr = TEMPLATES[risque_key]['fr']
    template_wo = TEMPLATES[risque_key]['wo']
    
    fr = template_fr.format(
        quartier=quartier, 
        niveau=niveau_cm, 
        horizon=horizon_h, 
        point_rassemblement=point_rassemblement
    )
    
    wo = template_wo.format(
        quartier=quartier, 
        niveau=niveau_cm, 
        horizon=horizon_h, 
        point_rassemblement=point_rassemblement
    )
    
    return {'fr': fr, 'wo': wo}
