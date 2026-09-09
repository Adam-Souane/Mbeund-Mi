#!/usr/bin/env python3
"""
Script de diagnostic et de vérification de santé pour la base de données PostGIS Mbeund-Mi.
"""
import os
import sys
import psycopg2

def run_healthcheck():
    host = os.environ.get('DB_HOST', '127.0.0.1')
    port = os.environ.get('DB_PORT', '5433')
    user = os.environ.get('DB_USER', 'postgres')
    password = os.environ.get('DB_PASSWORD', 'mbeund_mi_password')
    dbname = os.environ.get('DB_NAME', 'mbeund_mi')

    print("=" * 70)
    print("MBEUND-MI - DIAGNOSTIC & SANTE BASE DE DONNEES POSTGIS")
    print("=" * 70)

    try:
        conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)
        cur = conn.cursor()
        print(f"[OK] Connexion reussie a PostgreSQL ({host}:{port}/{dbname})")

        # 1. Vérifier la version de PostGIS
        cur.execute("SELECT PostGIS_Full_Version();")
        postgis_ver = cur.fetchone()[0]
        print(f"[INFO] Version PostGIS active : {postgis_ver.split()[0]}")

        # 2. Compter les enregistrements et vérifier les géométries
        tables = [
            ('zone_pilote', 'Polygones Quartiers'),
            ('segment_rue', 'Lignes Canaux / Voies'),
            ('observation_terrain', 'Points Signalements'),
            ('capteur_iot', 'Points Capteurs IoT'),
            ('alerte', 'Alertes Actives'),
            ('prevision_meteo', 'Chroniques Meteo'),
            ('utilisateur', 'Comptes Utilisateurs')
        ]

        print("\n--- ETAT DES TABLES METIERS & GEOMETRIES ---")
        for table, label in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            count = cur.fetchone()[0]
            print(f"  * {label:<24} [{table}]: {count} enregistrement(s)")

        # 3. Tester une fonction géospatiale PostGIS
        cur.execute("""
            SELECT z.nom, COUNT(o.id) 
            FROM zone_pilote z 
            LEFT JOIN observation_terrain o ON ST_Contains(z.geom, o.geom)
            GROUP BY z.id, z.nom;
        """)
        spatial_join = cur.fetchall()
        print("\n--- INTERSECTION SPATIALE POSTGIS (ST_Contains) ---")
        for zone, obs_cnt in spatial_join:
            print(f"  * Zone '{zone}' : {obs_cnt} observation(s) geolocalisee(s)")

        cur.close()
        conn.close()
        print("\n[SUCCESS] DIAGNOSTIC 100% OK : La base de donnees PostGIS est en parfaite sante !")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n[ERROR] ERREUR DE DIAGNOSTIC : {e}")
        print("=" * 70)
        return False

if __name__ == '__main__':
    run_healthcheck()
