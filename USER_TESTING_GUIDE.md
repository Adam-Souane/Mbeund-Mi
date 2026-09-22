# 👥 Guide de Test Utilisateur - Système Mbeund-Mi

**Objectif:** Valider le système de prévention des inondations avec des utilisateurs réels (autorités, citoyens)

**Durée totale:** 1-2 jours

---

## 📋 CHECKLIST DE TEST

### **PHASE 1: Tests Autorités (4-6 heures)**

**Objectif:** Valider que les alertes SMS fonctionnent et que le dashboard est utile

#### **Test 1: Alerte SMS** ⏱️ 30 min
- [ ] Connecter une autorité avec numéro réel
- [ ] Déclencher une prédiction "rouge" manuellement
- [ ] Vérifier que SMS est reçu en < 1 seconde
- [ ] Vérifier le contenu du message (zone, niveau, probabilités)
- [ ] Tester avec 3-5 autorités différentes

**Commande de test:**
```python
# Dans Django shell
from alertes.tasks import predire_risques_avec_random_forest
result = predire_risques_avec_random_forest()
print(result)
```

#### **Test 2: Dashboard** ⏱️ 45 min
- [ ] Accéder à `/autorite/predictions`
- [ ] Vérifier les graphiques se chargent
- [ ] Vérifier les scores affichés sont corrects
- [ ] Vérifier les seuils d'alerte s'affichent
- [ ] Tester le refresh (F5)
- [ ] Tester sur mobile (responsive)

#### **Test 3: Notifications Push** ⏱️ 30 min
- [ ] Connecter une autorité
- [ ] Déclencher une alerte
- [ ] Vérifier notification push arrive
- [ ] Vérifier clic ouvre la zone concernée

#### **Test 4: Historique Alertes** ⏱️ 30 min
- [ ] Vérifier les alertes passées s'affichent
- [ ] Filtrer par zone
- [ ] Filtrer par niveau
- [ ] Exporter la liste

---

### **PHASE 2: Tests Citoyens (3-4 heures)**

**Objectif:** Valider que les citoyens reçoivent les informations

#### **Test 5: Notifications Citoyens** ⏱️ 45 min
- [ ] S'inscrire comme citoyen à une zone
- [ ] Déclencher une alerte dans cette zone
- [ ] Vérifier SMS reçu
- [ ] Vérifier notification web reçue
- [ ] Vérifier notification push reçue

#### **Test 6: Page Carte** ⏱️ 45 min
- [ ] Vérifier que les zones colorées correspondent à la prédiction
- [ ] Vérifier zoom/drag fonctionne
- [ ] Cliquer sur une zone pour voir détails
- [ ] Vérifier mise à jour temps réel

#### **Test 7: Page Alertes** ⏱️ 45 min
- [ ] Voir les alertes en cours
- [ ] Voir l'historique des alertes
- [ ] Consulter les prévisions pour sa zone
- [ ] Voir les points de refuge proches

---

### **PHASE 3: Tests Système Complet (2-3 heures)**

#### **Test 8: Cycle Complet** ⏱️ 1h
- [ ] Créer des données pluviométriques de test
- [ ] Lancer une prédiction
- [ ] Vérifier zone mise à jour
- [ ] Vérifier alerte créée si risque
- [ ] Vérifier SMS/notification envoyés
- [ ] Vérifier historique enregistré

#### **Test 9: Robustesse** ⏱️ 1h
- [ ] Redémarrer Celery Worker
- [ ] Vérifier que les tâches reprennent
- [ ] Vérifier aucune alerte perdue
- [ ] Vérifier pas de doublons

#### **Test 10: Performance** ⏱️ 30 min
- [ ] Charger le dashboard (temps < 3s)
- [ ] Générer 100 alertes (vérifier pas de lag)
- [ ] Vérifier CPU/RAM des workers

---

## 🧪 SCÉNARIOS DE TEST DÉTAILLÉS

### **Scénario 1: Pluie Normale (Pas d'Alerte)**

```python
# 1. Créer une mesure pluviométrique faible
from capteurs.models import Capteur, Mesure
from django.utils import timezone

capteur = Capteur.objects.filter(type='pluviometre').first()
Mesure.objects.create(
    capteur=capteur,
    valeur=5.0,  # 5mm = faible
    timestamp=timezone.now()
)

# 2. Lancer prédiction
from alertes.tasks import predire_risques_avec_random_forest
result = predire_risques_avec_random_forest()

# Attendre: Zone devrait rester VERT, pas d'alerte
```

**Vérifications:**
- ✅ Zone reste verte
- ✅ Score < seuil_jaune
- ✅ Aucune alerte créée

---

### **Scénario 2: Forte Pluie (Alerte Jaune)**

```python
# 1. Créer une mesure pluviométrique modérée
Mesure.objects.create(
    capteur=capteur,
    valeur=45.0,  # 45mm = modéré
    timestamp=timezone.now()
)

# 2. Lancer prédiction
result = predire_risques_avec_random_forest()

# Attendre: Zone devrait passer en JAUNE, alerte créée
```

**Vérifications:**
- ✅ Zone passe à jaune
- ✅ Score >= seuil_jaune et < seuil_orange
- ✅ Alerte JAUNE créée
- ✅ SMS envoyé aux autorités
- ✅ Notification web envoyée

---

### **Scénario 3: Pluie Extrême (Alerte Rouge)**

```python
# 1. Créer une mesure pluviométrique extrême
Mesure.objects.create(
    capteur=capteur,
    valeur=85.0,  # 85mm = grave
    timestamp=timezone.now()
)

# 2. Lancer prédiction
result = predire_risques_avec_random_forest()

# Attendre: Zone devrait passer en ROUGE, alerte critique
```

**Vérifications:**
- ✅ Zone passe à rouge
- ✅ Score >= seuil_rouge
- ✅ Alerte ROUGE créée
- ✅ SMS envoyé immédiatement
- ✅ Notification push prioritaire

---

## 📊 MÉTRIQUES À ENREGISTRER

Pendant chaque test, documenter:

| Métrique | Test 1 | Test 2 | Test 3 | Notes |
|----------|--------|--------|--------|-------|
| Temps SMS | ___ ms | ___ ms | ___ ms | < 2s? |
| Temps Alerte | ___ ms | ___ ms | ___ ms | < 1s? |
| Temps Dashboard | ___ ms | ___ ms | ___ ms | < 3s? |
| Erreurs reçues | 0 | 0 | 0 | Aucune? |
| SMS reçus | 3/3 | 3/3 | 3/3 | 100%? |
| Notifications push | 3/3 | 3/3 | 3/3 | 100%? |

---

## 🎯 FEEDBACK À RECUEILLIR

### **Questions pour les Autorités**

1. **Clarté des alertes:** Les SMS sont-ils clairs et utiles?
2. **Temps de réaction:** Avez-vous agi assez vite après l'alerte?
3. **Dashboard:** Est-ce facile de comprendre le risque?
4. **Prédictions:** Les prédictions correspondent-elles à la réalité?
5. **Fréquence:** Vous recevez trop/pas assez d'alertes?
6. **Suggestions:** Qu'amélieriez-vous?

### **Questions pour les Citoyens**

1. **Compréhension:** Comprenez-vous ce que signifie "jaune"?
2. **Temps:** Avez-vous reçu l'alerte assez tôt?
3. **Actions:** Qu'avez-vous fait après réception de l'alerte?
4. **Confiance:** Faites-vous confiance aux prédictions?
5. **Points de refuge:** Avez-vous trouvé les points d'évacuation?
6. **Suggestions:** Qu'amérieriez-vous?

---

## 📝 PLAN D'ACTION APRÈS TESTS

### **Si problèmes détectés:**

1. **SMS non reçu:** Vérifier Twilio credentials
2. **Dashboard lent:** Optimiser requêtes API
3. **Prédictions inexactes:** Affiner seuils d'alerte
4. **Notifications manquantes:** Vérifier Firebase config

### **Si tests réussis:**

1. ✅ Déployer sur serveur production
2. ✅ Configurer avec vrais numéros
3. ✅ Former autorités en direct
4. ✅ Lancer en mode production 24/7

---

## 🚀 RÉSUMÉ CHECKLIST

- [ ] Tests autorités 4-6h
- [ ] Tests citoyens 3-4h
- [ ] Tests système 2-3h
- [ ] Feedback collecté
- [ ] Problèmes résolus
- [ ] Déploiement approuvé

**Total:** ~10-15 heures de test

**Résultat attendu:** ✅ Système prêt pour production 24/7

