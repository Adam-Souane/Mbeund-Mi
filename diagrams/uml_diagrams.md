# Dossier de Modélisation UML — PFE Mbeund-Mi

## Plateforme de prévention et de gestion des inondations (Dakar, Thiaroye-sur-Mer)

Ce document rassemble l'ensemble des **diagrammes UML** nécessaires pour la rédaction du mémoire et la soutenance de votre **Projet de Fin d'Études (PFE)**.

Tous les diagrammes sont rédigés en syntaxe **Mermaid**, permettant une intégration directe dans Markdown, GitHub, Notion ou leur exportation sous forme d'images haute résolution pour Microsoft Word / LaTeX.

---

## 1. 🎯 Diagramme des Cas d'Utilisation (UML Use Case)

Ce diagramme identifie les différents acteurs du système et leurs interactions avec la plateforme **Mbeund-Mi**.

### Acteurs du Système
- **Citoyen / Habitant de Thiaroye** : Signale les risques sur le terrain et consulte la carte des alertes.
- **Agent de Terrain** : Effectue des vérifications, valide les observations citoyennes et relève l'état des infrastructures de drainage.
- **Décideur / Autorité Municipale** : Visualise les tableaux de bord décisionnels et valide l'émission des alertes officielles.
- **Administrateur Système** : Gère les comptes utilisateurs, paramètre les zones pilotes et supervise les capteurs IoT.
- **Système Externe (ANACIM / Capteurs IoT)** : Fournit automatiquement les données météorologiques et les télémesures de niveau d'eau.

```mermaid
graph TD
    subgraph Acteurs
        C[👤 Citoyen]
        A[👷 Agent de Terrain]
        D[🏛️ Décideur / Maire]
        ADM[⚙️ Administrateur]
        IOT[📡 Capteurs IoT / Météo ANACIM]
    end

    subgraph "Système Mbeund-Mi (Cas d'Utilisation)"
        UC1((Consulter la carte des alertes & zones à risque))
        UC2((Soumettre une observation de terrain))
        UC3((Valider / Modérer les observations))
        UC4((Calculer le score de risque))
        UC5((Émettre une alerte d'inondation))
        UC6((Recevoir les télémesures IoT & météo))
        UC7((Gérer les zones pilotes et segments de rue))
        UC8((Gérer les utilisateurs et les accès))
        UC9((Exporter le tableau de bord décisionnel))
    end

    C --> UC1
    C --> UC2

    A --> UC1
    A --> UC2
    A --> UC3

    D --> UC1
    D --> UC5
    D --> UC9

    ADM --> UC7
    ADM --> UC8

    IOT --> UC6
    UC6 --> UC4
    UC2 --> UC4
    UC4 --> UC5
```

---

## 2. 🧱 Diagramme de Classes UML (UML Class Diagram)

Le diagramme de classes représente le modèle statique orienté objet du système, incluant les attributs métiers, les types géospatiaux (PostGIS/GeoDjango) et les méthodes principales.

```mermaid
classDiagram
    class Utilisateur {
        +int id
        +string email
        +string motDePasse
        +string nom
        +string prenom
        +RoleEnum role
        +string telephone
        +boolean actif
        +seConnecter() boolean
        +mettreAJourProfil() void
    }

    class ZonePilote {
        +int id
        +string nom
        +PolygonGeometry geom
        +string description
        +float scoreRisqueMoyen
        +calculerScoreRisque() float
        +getSuperficieHectares() float
    }

    class SegmentRue {
        +int id
        +string nom
        +LineStringGeometry geom
        +float altitudeMoyenne
        +float pente
        +EtatDrainageEnum etatDrainage
        +float scoreRisqueActuel
        +evaluerRisqueSegment() float
    }

    class ObservationTerrain {
        +int id
        +TypeObservationEnum typeObservation
        +float valeur
        +string description
        +PointGeometry geom
        +string photoUrl
        +DateTime dateObservation
        +boolean valide
        +validerObservation() void
    }

    class CapteurIoT {
        +int id
        +string codeIdentifiant
        +TypeCapteurEnum typeCapteur
        +PointGeometry geom
        +StatutCapteurEnum statut
        +DateTime dernierReleve
        +recevoirTelemesure(float valeur) void
    }

    class PrevisionMeteo {
        +int id
        +DateTime datePrevision
        +float temperature
        +float precipitation
        +float vitesseVent
        +string source
    }

    class Alerte {
        +int id
        +NiveauAlerteEnum niveau
        +string message
        +Geometry geom
        +DateTime dateEmission
        +DateTime dateExpiration
        +StatutAlerteEnum statut
        +publierAlerte() void
        +archiverAlerte() void
    }

    class HistoriqueRisque {
        +int id
        +string typeCible
        +int cibleId
        +float scoreRisque
        +DateTime dateCalcul
        +JSON details
    }

    Utilisateur "1" -- "0..*" ObservationTerrain : signale >
    ZonePilote "1" -- "0..*" SegmentRue : contient >
    ZonePilote "1" -- "0..*" CapteurIoT : est équippée de >
    ZonePilote "1" -- "0..*" Alerte : fait l'objet de >
    ZonePilote "1" --> "0..*" ObservationTerrain : recouvre (Spatial ST_Contains)
```

---

## 3. 🔄 Diagrammes de Séquence UML (UML Sequence Diagrams)

### Scénario A : Signalement citoyen d'une accumulation d'eau sur le terrain

Ce diagramme détaille le flux d'échange lors de la soumission d'une alerte citoyenne géolocalisée.

```mermaid
sequenceDiagram
    autonumber
    actor Citoyen as 👤 Citoyen
    participant App as 📱 Application Web/Mobile
    participant API as ⚙️ Backend API (GeoDjango)
    participant BDD as 🗄️ PostGIS Database

    Citoyen->>App: Ouvre le formulaire de signalement
    Citoyen->>App: Active la géolocalisation GPS & prend une photo
    App->>API: POST /api/observations (type, coords GPS, photo)
    API->>API: Vérifier les données & calculer la Zone Pilote (ST_Contains)
    API->>BDD: INSERT INTO observation_terrain(...)
    BDD-->>API: Observation enregistrée (ID: 104)
    API->>BDD: SELECT nom FROM zone_pilote WHERE ST_Contains(geom, ST_Point(lon, lat))
    BDD-->>API: Zone "Ndakhane"
    API-->>App: 201 Created (Observation enregistrée dans la zone Ndakhane)
    App-->>Citoyen: Confirmation visuelle "Signalement transmis !"
```

---

### Scénario B : Calcul automatique du risque & Déclenchement d'alerte

Ce diagramme montre comment le système agrège les métadonnées (IoT, météo, signalements) pour générer automatiquement une alerte d'inondation.

```mermaid
sequenceDiagram
    autonumber
    participant Job as ⏱️ Moteur de Calcul / Worker
    participant ANACIM as 🌤️ Service Météo ANACIM
    participant BDD as 🗄️ PostGIS Database
    participant API as ⚙️ Backend API
    actor Maire as 🏛️ Décideur / Maire

    Job->>ANACIM: Fetch dernières prévisions de précipitations
    ANACIM-->>Job: Prévision: 48mm de pluie dans 3 heures
    Job->>BDD: Query état des drainages & signalements récents (Ndakhane)
    BDD-->>Job: Canaux obstrués (80%) + 3 accumulations d'eau
    Job->>Job: Algorithme de risque: (Pluie * 0.4) + (Drainage * 0.4) + (Signalements * 0.2) = 8.2 (Risque ROUGE)
    Job->>BDD: INSERT INTO alerte (niveau='ROUGE', zone_pilote_id=2, message=...)
    Job->>BDD: INSERT INTO historique_risque (...)
    API->>Maire: Notification Push / SMS "Risque ROUGE à Ndakhane"
    Maire->>API: Valider & Diffuser l'Alerte Officielle
```

---

## 4. 🏗️ Diagramme de Déploiement UML (UML Deployment Diagram)

Ce diagramme illustre l'architecture physique et l'infrastructure d'hébergement basée sur des conteneurs **Docker**.

```mermaid
graph TB
    subgraph "Poste Client / Utilisateur"
        Browser["🌐 Navigateur Web (Leaflet.js / React / HTML5)"]
        MobileApp["📱 Application Mobile (PWA / Flutter)"]
    end

    subgraph "Serveur d'Application (Docker Host)"
        subgraph "Conteneur Proxy Nginx"
            Nginx["Nginx Reverse Proxy (SSL / TLS)"]
        end

        subgraph "Conteneur Backend (GeoDjango / API REST)"
            API_Engine["GeoDjango Web Framework"]
            Celery_Worker["Celery Worker (Calculs asynchrones)"]
        end

        subgraph "Conteneur Cache & Broker (Redis)"
            Redis_Cache["Redis 7 Alpine"]
        end

        subgraph "Conteneur Base de Données (PostGIS)"
            PostGIS_DB[("PostgreSQL 15 + PostGIS 3.3<br/>DB: mbeund_mi")]
        end
    end

    subgraph "Services Externes"
        ANACIM_API["ANACIM Météo Senegal API"]
        SMS_Gateway["Passerelle SMS / Push Notifications"]
    end

    Browser -->|HTTPS / Port 443| Nginx
    MobileApp -->|HTTPS / REST API| Nginx
    Nginx -->|Proxy Pass Port 8000| API_Engine
    API_Engine -->|TCP Port 5432| PostGIS_DB
    API_Engine -->|Cache / Task Queue Port 6379| Redis_Cache
    Celery_Worker -->|Tâches de fond| Redis_Cache
    Celery_Worker -->|Requêtes spatiales| PostGIS_DB
    Celery_Worker -->|API REST| ANACIM_API
    API_Engine -->|SMS Alerting| SMS_Gateway
```

---

## 💡 Conseils pour l'intégration dans le Mémoire PFE

1. **Intégration Microsoft Word / Google Docs** :
   - Vous pouvez ouvrir ce fichier dans VS Code ou GitHub, et faire un clic droit sur chaque diagramme Mermaid pour l'exporter en **PNG / SVG**.
2. **Présentation orale / Soutenance** :
   - Utilisez le **Diagramme des Cas d'Utilisation** dans la phase *Analyse des Besoins*.
   - Utilisez le **Diagramme de Classes** et le **Diagramme de Déploiement** dans la phase *Conception & Architecture*.
