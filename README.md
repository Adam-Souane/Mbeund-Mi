# Mbeund-Mi - Plateforme de Prévention des Inondations (Thiaroye Sur Mer)

**Projet de Fin de Formation (PFF) - 2026**
Ce dépôt contient le Backend (Django) et le module d'Intelligence Artificielle de la plateforme Mbeund-Mi.

## 🚀 Démarrage Rapide (Pour l'équipe)

### 1. Activer l'Environnement Virtuel
Tout a été installé et isolé pour éviter les conflits. Ouvrez un terminal à la racine du projet et tapez :
```bash
.\env\Scripts\activate
```

### 2. Démarrer le Serveur Backend (Mama Adam & Mame Diarra)
Une fois l'environnement activé, naviguez dans le dossier backend et lancez le serveur :
```bash
cd backend
python manage.py runserver
```
L'API sera disponible sur : `http://localhost:8000/api/`

### 3. Lancer la Démonstration de l'IA (Maïmouna Sall)
Pour montrer le fonctionnement de l'IA, de l'envoi de SMS (Twilio) et du relais vers le Backend (Firebase) lors de la soutenance :
```bash
cd mbeund_mi_ia
python demo/demo_scenarii.py
```

---

## 📡 Documentation API (Pour Ngoné - Frontend)

Le Backend est configuré avec `CORS_ALLOW_ALL_ORIGINS = True` pour te permettre de faire tes requêtes depuis React/React Native sans blocage.

### Points d'accès (Endpoints) :
URL de base : `http://localhost:8000/api/`

- **GET `/api/zones/`** : Récupérer toutes les zones de Thiaroye (lat, lng, nom, seuil alerte).
- **GET `/api/mesures/`** : Récupérer l'historique des niveaux d'eau et de pluie.
- **GET `/api/alertes/`** : Récupérer les alertes générées par l'IA (Vert, Jaune, Orange, Rouge).
- **POST `/api/signalements/`** : Permet aux citoyens de signaler un problème.
  - *Payload attendu (JSON ou FormData)* :
    ```json
    {
      "type_probleme": "inondation",
      "description": "L'eau rentre dans la maison.",
      "latitude": 14.743,
      "longitude": -17.405,
      "photo": "[FICHIER IMAGE]"
    }
    ```
  - *Note sur le Geofencing* : Si les coordonnées envoyées sont à plus de 4 km de Thiaroye Sur Mer, l'API renverra une erreur 400 (Validation Error) pour bloquer le signalement. Les photos sont automatiquement compressées par le serveur.

---

## 🔒 Sécurité & Production
Avant de déployer le projet sur un serveur final (ex: Heroku, AWS, Render) :
1. Les clés secrètes (Twilio, Firebase, Django) sont protégées par le fichier `.env`. **Ne jamais l'envoyer sur GitHub.** Le fichier `.gitignore` est déjà configuré pour l'ignorer.
2. Dans `backend/mbeund_mi_backend/settings.py`, passez `DEBUG = False`.
3. Assurez-vous que le fichier `firebase_credentials.json` n'est pas envoyé sur des dépôts publics.