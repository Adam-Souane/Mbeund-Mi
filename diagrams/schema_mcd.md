# Diagramme Conceptuel des Données (MCD / ERD)

## Plateforme de prévention des inondations — Mbeund-Mi (Dakar, Thiaroye-sur-Mer)

Ce document présente le schéma conceptuel et relationnel de la base de données spatio-temporelle sous forme de diagramme **Mermaid**.

---

## 📐 Diagramme Entity-Relationship (ERD)

```mermaid
erDiagram
    UTILISATEUR {
        int id PK
        string email UK
        string mot_de_passe
        string nom
        string prenom
        string role "CITOYEN | AGENT | ADMINISTRATEUR | DECIDEUR"
        string telephone
        boolean actif
        timestamp created_at
    }

    ZONE_PILOTE {
        int id PK
        string nom UK
        Polygon geom "SRID 4326 (WGS 84)"
        text description
        numeric score_risque_moyen
        timestamp created_at
    }

    SEGMENT_RUE {
        int id PK
        string nom
        LineString geom "SRID 4326 (WGS 84)"
        numeric altitude_moyenne
        numeric pente
        string etat_drainage "Bon | Moyen | Obstrué | Inexistant"
        int zone_pilote_id FK
        numeric score_risque_actuel
        timestamp created_at
    }

    OBSERVATION_TERRAIN {
        int id PK
        string type_observation "Accumulation eau | Obstruction canalisation | Inondation | Autre"
        numeric valeur
        text description
        Point geom "SRID 4326 (WGS 84)"
        string photo_url
        timestamp date_observation
        int utilisateur_id FK
        string observateur
        boolean valide
    }

    CAPTEUR_IOT {
        int id PK
        string code_identifiant UK
        string type_capteur "LIMNIMETRE | PLUVIOMETRE"
        Point geom "SRID 4326 (WGS 84)"
        int zone_pilote_id FK
        string statut "ACTIF | INACTIF | MAINTENANCE"
        timestamp dernier_releve
        timestamp created_at
    }

    PREVISION_METEO {
        int id PK
        timestamp date_prevision
        numeric temperature
        numeric precipitation
        numeric vitesse_vent
        string source
        timestamp created_at
    }

    ALERTE {
        int id PK
        string niveau "JAUNE | ORANGE | ROUGE"
        text message
        Geometry geom "SRID 4326 (optionnel)"
        int zone_pilote_id FK
        timestamp date_emission
        timestamp date_expiration
        string statut "ACTIVE | RESOLUE | ARCHIVEE"
    }

    HISTORIQUE_RISQUE {
        int id PK
        string type_cible "ZONE | SEGMENT"
        int cible_id
        numeric score_risque
        timestamp date_calcul
        jsonb details
    }

    ZONE_PILOTE ||--o{ SEGMENT_RUE : "contient / englobe"
    ZONE_PILOTE ||--o{ ALERTE : "concerne"
    ZONE_PILOTE ||--o{ CAPTEUR_IOT : "abrite"
    UTILISATEUR ||--o{ OBSERVATION_TERRAIN : "signale"
    ZONE_PILOTE ..o{ OBSERVATION_TERRAIN : "recouvre géographiquement (ST_Contains)"
```

---

## 🔗 Description des Relations

1. **`ZONE_PILOTE` → `SEGMENT_RUE` (1:N)**
   - Une zone pilote englobe plusieurs segments de rue / axes de drainage.
   - Relation gérée via la clé étrangère `zone_pilote_id` (avec suppression `ON DELETE SET NULL`).

2. **`ZONE_PILOTE` → `ALERTE` (1:N)**
   - Une alerte d'inondation (Jaune, Orange, Rouge) peut être émise pour une zone pilote spécifique.

3. **`ZONE_PILOTE` → `CAPTEUR_IOT` (1:N)**
   - Des capteurs physiques (ex: capteurs de niveau d'eau sonar/ultrasons ou pluviomètres) sont déployés dans une zone pilote.

4. **`UTILISATEUR` → `OBSERVATION_TERRAIN` (1:N)**
   - Un utilisateur enregistré (citoyen ou agent terrain) peut poster un ou plusieurs signalements d'accumulation d'eau ou d'obstruction.

5. **`ZONE_PILOTE` → `OBSERVATION_TERRAIN` (Relation Spatiale Implicite)**
   - La correspondance géographique entre une observation ponctuelle (`Point`) et une zone (`Polygon`) s'effectue dynamiquement via la fonction PostGIS `ST_Contains(zone_pilote.geom, observation_terrain.geom)`.
