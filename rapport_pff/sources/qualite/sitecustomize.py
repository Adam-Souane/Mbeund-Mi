# Chargé automatiquement au démarrage de Python (PYTHONPATH de test uniquement) :
# GDAL d'OSGeo4W doit précéder sqlite3, que coverage.py ouvre très tôt.
import ctypes
import os
_OSGEO = r'C:\Users\pc\AppData\Local\Programs\OSGeo4W\bin'
if os.path.isdir(_OSGEO):
    os.add_dll_directory(_OSGEO)
    ctypes.CDLL(os.path.join(_OSGEO, 'gdal313.dll'))
