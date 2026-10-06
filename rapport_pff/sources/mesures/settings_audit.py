# Réglages de test locaux (hors dépôt) : SQLite + GDAL/GEOS d'OSGeo4W.
# GDAL est chargé avant le module sqlite3 de Python : dans l'ordre inverse,
# le sqlite3.dll de Python masque celui d'OSGeo4W et GDAL ne se charge plus.
import ctypes
import os
_OSGEO = r'C:\Users\pc\AppData\Local\Programs\OSGeo4W\bin'
os.add_dll_directory(_OSGEO)
ctypes.CDLL(os.path.join(_OSGEO, 'gdal313.dll'))

from mbeund_mi_backend.settings.test import *  # noqa: E402,F401,F403
GDAL_LIBRARY_PATH = os.path.join(_OSGEO, 'gdal313.dll')
GEOS_LIBRARY_PATH = os.path.join(_OSGEO, 'geos_c.dll')
