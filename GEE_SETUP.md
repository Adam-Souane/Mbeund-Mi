# Configuration Google Earth Engine (GEE) pour Mbeund-Mi

## 📡 Vue d'ensemble

Google Earth Engine (GEE) est un service gratuit de Google qui permet d'analyser des **images satellites gratuites** pour détecter les inondations en temps réel.

### Comment ça marche?

1. **Satellites Sentinel-2** prennent des photos de la Terre tous les 5 jours
2. **Indice NDWI** (Normalized Difference Water Index) détecte où il y a de l'eau
3. **Comparaison** entre périodes de référence (saison sèche) et périodes récentes
4. **Détection** des NOUVELLES zones inondées
5. **Mise à jour automatique** des zones de risque sur la carte
6. **Alertes SMS** envoyées automatiquement aux autorités et citoyens

---

## 🔐 Étape 1: Configuration de l'authentification GEE

### Prérequis
- Un compte Google (gratuit)
- Python 3.8+ installé
- La CLI `earthengine` installée (déjà fait: `pip install earthengine-api`)

### Installation et Authentification

1. **Ouvrir un terminal** sur votre ordinateur
2. **Exécuter la commande d'authentification:**
   ```bash
   earthengine authenticate
   ```
   
3. **Un navigateur s'ouvre:** Connectez-vous avec votre compte Google et autorisez l'accès

4. **Les identifiants sont stockés** dans `~/.config/earthengine/` (automatique)

5. **Vérifier que ça marche:**
   ```bash
   earthengine info
   ```
   Vous devriez voir des informations sur votre compte.

---

## 🔑 Étape 2: GEE_PROJECT_ID dans .env

Le fichier `/backend/.env` a **déjà** `GEE_PROJECT_ID=mbeund-mi` configuré.

✅ **C'est bon!** Pas besoin de changer.

---

## ⚙️ Étape 3: Démarrage du système

### Démarrer Celery Worker (détection des inondations)

```bash
cd backend
celery -A mbeund_mi_backend worker -l info
```

### Démarrer Celery Beat (tâches périodiques)

```bash
cd backend
celery -A mbeund_mi_backend beat -l info
```

### Vérifier que ça fonctionne

Dans les logs du worker Celery, vous devriez voir (toutes les 12 heures):
```
[GEE Task] Démarrage de l'analyse GEE périodique...
[GEE Task] Analyse GEE terminée. Épisode d'inondation enregistré...
[GEE Integration] Zone mise à jour : vert → rouge (détection satellite)
[GEE Integration] Alerte critique créée...
```

---

## 🎯 Résumé du flux automatique

```
Chaque 12 heures (Celery Beat)
    ↓
analyse_gee_periodique() lance
    ↓
Télécharge images Sentinel-2 (derniers 15 jours)
    ↓
Calcule NDWI (indice d'eau)
    ↓
Détecte zones nouvellement inondées
    ↓
Crée EpisodeInondation en base de données
    ↓
mettre_a_jour_zones_depuis_gee() met à jour les zones
    ↓
Zone niveau_risque ← ROUGE
Zone score_risque_moyen ← 0.95
    ↓
Crée Alerte critique
    ↓
Envoie SMS aux autorités + citoyens
    ↓
Met à jour la carte interactive en temps réel ✅
```

---

## 🐛 Dépannage

### "Analyse GEE indisponible (authentification manquante)"

**Cause:** `earthengine authenticate` n'a pas été exécuté

**Solution:**
1. Ouvrir terminal
2. Lancer `earthengine authenticate`
3. Se connecter avec Google
4. Relancer le worker Celery

### "GEE_PROJECT_ID manquant"

**Cause:** .env n'a pas `GEE_PROJECT_ID`

**Solution:**
1. Ajouter à `/backend/.env`: `GEE_PROJECT_ID=mbeund-mi`
2. Relancer le worker

### "Pas d'images satellites disponibles"

**Cause:** Nuages trop épais ou pas de données Sentinel-2 pour la période

**Solution:** 
- Attendre 5 jours (cycle Sentinel-2)
- Période doit avoir <20% de couverture nuageuse
- GEE filtre automatiquement

---

## 📊 Données Utilisées

| Source | Données | Résolution | Fréquence |
|--------|---------|-----------|-----------|
| **Sentinel-2** (Copernicus) | Images RVB + Infrarouge | 10 mètres | Tous les 5 jours |
| **Formule NDWI** | Détection d'eau | 10 mètres | Calculé |
| **Zones de risque** (Django) | Polygones/quartiers | Variable | Mise à jour en temps réel |

---

## ✅ Checklist Finale

- [ ] `earthengine authenticate` exécuté et validé
- [ ] `~/.config/earthengine/` contient les identifiants
- [ ] `/backend/.env` a `GEE_PROJECT_ID=mbeund-mi`
- [ ] Celery Worker démarre sans erreurs
- [ ] Celery Beat démarre sans erreurs
- [ ] Tâche `analyse_gee_periodique` prévue toutes les 12 heures
- [ ] Zones de risque se mettent à jour quand inondation détectée
- [ ] SMS envoyés automatiquement aux autorités

---

## 🎉 Résultat

Une fois configuré, le système:

✅ Détecte automatiquement les inondations via satellite  
✅ Met à jour les zones rouges/jaunes/vertes en temps réel  
✅ Envoie des alertes SMS immédiatement  
✅ Crée un historique des épisodes d'inondation  
✅ Affiche les zones sur la carte interactive  

**Aucune intervention manuelle nécessaire après configuration initiale!**
