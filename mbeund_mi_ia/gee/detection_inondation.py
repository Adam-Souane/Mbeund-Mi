import ee
import json
import os
from config_gee import init_gee, get_thiaroye_geometry, get_sentinel2_image, calculer_ndwi

def detecter_zones_inondees(date_reference_debut, date_reference_fin, date_recente_debut, date_recente_fin):
    """
    Compare l'état de l'eau entre une période de référence (saison sèche)
    et une période récente (après pluie).
    """
    if not init_gee():
        return None
        
    print(f"Analyse GEE de {date_recente_debut} à {date_recente_fin}...")
    zone = get_thiaroye_geometry()
    
    # Image de référence (ex: Janvier, saison sèche)
    img_ref = get_sentinel2_image(date_reference_debut, date_reference_fin)
    eau_ref = calculer_ndwi(img_ref)
    
    # Image récente (ex: Août après fortes pluies)
    img_recente = get_sentinel2_image(date_recente_debut, date_recente_fin)
    eau_recente = calculer_ndwi(img_recente)
    
    # Zones nouvellement inondées : eau_recente == 1 ET eau_ref == 0
    inondations = eau_recente.And(eau_ref.Not())
    
    # Calcul précis de la surface en hectares côté serveur GEE
    area_image = ee.Image.pixelArea().updateMask(inondations)
    stats = area_image.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=zone,
        scale=10, # Résolution de Sentinel-2 (10m)
        maxPixels=1e9
    ).getInfo()
    
    surface_totale_ha = stats.get('area', 0) / 10000 if stats.get('area') else 0
    
    # Vectoriser le résultat pour l'export GeoJSON vers le frontend React / Maps
    vectors = inondations.updateMask(inondations).reduceToVectors(
        geometry=zone,
        crs=img_recente.projection(),
        scale=10,
        geometryType='polygon',
        eightConnected=False,
        maxPixels=1e9
    )
    
    features = vectors.getInfo()
    
    resultat = {
        "metadata": {
            "surface_inondee_ha": round(surface_totale_ha, 2),
            "date_analyse": date_recente_fin,
            "crs": "EPSG:4326"
        },
        "geojson": features
    }
    
    # Exporter le résultat localement (pour l'envoyer plus tard à l'API Django)
    base_dir = os.path.dirname(os.path.dirname(__file__))
    out_dir = os.path.join(base_dir, 'data')
    os.makedirs(out_dir, exist_ok=True)
    
    out_file = os.path.join(out_dir, 'dernieres_inondations_gee.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(resultat, f, ensure_ascii=False, indent=2)
        
    print(f"[SUCCES] Analyse GEE terminée : {surface_totale_ha:.2f} hectares inondés détectés à Thiaroye.")
    print(f"GeoJSON exporté dans {out_file}")
    
    return resultat

if __name__ == "__main__":
    # Test avec des dates arbitraires pour valider le script
    # ATTENTION : Si le timeout API est long, c'est que la zone est très grande.
    detecter_zones_inondees('2026-01-01', '2026-01-31', '2026-08-01', '2026-08-15')
