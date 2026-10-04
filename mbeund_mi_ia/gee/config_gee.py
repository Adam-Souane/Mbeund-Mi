import logging
import os
import sys

import ee

logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from ia.config import GEE_PROJECT_ID
except ImportError:
    GEE_PROJECT_ID = os.getenv('GEE_PROJECT_ID', '')


def init_gee():
    """Initialise l'API Google Earth Engine"""
    try:
        if GEE_PROJECT_ID:
            ee.Initialize(project=GEE_PROJECT_ID)
        else:
            ee.Initialize()
        logger.info("Google Earth Engine initialisé")
        return True
    except Exception as e:
        conseil = "authentifiez-vous avec « earthengine authenticate »"
        if not GEE_PROJECT_ID:
            conseil += " et renseignez GEE_PROJECT_ID dans .env"
        logger.error("Initialisation de Google Earth Engine impossible (%s) : %s", conseil, e)
        return False

# Coordonnées du centre de Thiaroye Sur Mer
THIAROYE_LAT = 14.742
THIAROYE_LNG = -17.406

def get_thiaroye_geometry():
    """Retourne la géométrie de la zone d'étude (buffer de 5km)"""
    point = ee.Geometry.Point([THIAROYE_LNG, THIAROYE_LAT])
    return point.buffer(5000)  # 5 km autour du centre

def get_sentinel2_image(date_debut, date_fin):
    """
    Récupère une image Sentinel-2 filtrée sur la période et la zone,
    sans nuages (<20%).
    """
    zone = get_thiaroye_geometry()
    
    collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterBounds(zone)
                  .filterDate(date_debut, date_fin)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))
    
    # Prendre la médiane pour éliminer les petits nuages résiduels
    image = collection.median().clip(zone)
    return image

def calculer_ndwi(image):
    """
    Calcule l'indice NDWI (Normalized Difference Water Index).
    NDWI = (Green - NIR) / (Green + NIR) = (B3 - B8) / (B3 + B8)
    """
    ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI')
    # Seuil de détection d'eau : NDWI > 0.3
    water_mask = ndwi.gt(0.3)
    return water_mask
