# Configuration WhatsApp API pour OTP

## Pourquoi WhatsApp?

- ✅ **Illimité** (vs SMS gratuit Twilio: 5/jour)
- ✅ **100x moins cher** (€0.005 vs €0.08 par SMS)
- ✅ **Taux de livraison:** 95%+ (vs SMS 70%)
- ✅ **Plus rapide** que SMS
- ✅ **Très utilisé au Sénégal** (plus que SMS)

## Options

### Option 1: Meta WhatsApp Business API (RECOMMANDÉ) ⭐
**Coût:** ~€0.005 par message (100x moins cher)
**Essai gratuit:** 100 messages/jour
**Avantage:** Directement avec Meta, moins cher

### Option 2: Twilio WhatsApp
**Coût:** ~€0.08 par message (même que SMS)
**Avantage:** Même SDK Twilio, transition facile

---

## Configuration - Meta WhatsApp (Recommandé)

### Étape 1: Créer un compte Meta

1. Aller à https://business.facebook.com
2. Créer une entreprise (Business Manager)
3. Ajouter une app WhatsApp

### Étape 2: Configurer WhatsApp Business

1. Aller à https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
2. Cliquer "Get Started"
3. Créer une app WhatsApp ou en utiliser une existante
4. **Obtenir:**
   - `WHATSAPP_PHONE_NUMBER_ID` (exemple: `1206xxxxxxxxxx`)
   - `WHATSAPP_ACCESS_TOKEN` (token généré)

### Étape 3: Ajouter un numéro de téléphone

Dans WhatsApp Manager:
1. "Phone Numbers" → "Add number"
2. Entrer votre numéro Sénégal (+221...)
3. Vérifier le numéro par SMS/appel

### Étape 4: Configurer .env

```bash
# Ajouter dans backend/.env:
WHATSAPP_PHONE_NUMBER_ID=1206xxxxxxxxxx
WHATSAPP_ACCESS_TOKEN=EAABPxxxxxxxxxxxxxx

# Garder aussi Twilio en fallback:
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxx
```

### Étape 5: Installer dépendance

```bash
pip install requests  # Déjà installé généralement
```

### Étape 6: Tester

```bash
cd backend
python << 'EOF'
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.test')
django.setup()

from api.services.sms_service import send_otp_whatsapp

# Tester avec votre numéro
result = send_otp_whatsapp("+221779986828", "123456")
print(f"✅ WhatsApp configuré!" if result else "❌ Erreur")
EOF
```

---

## Architecture Implémentée

### Flow OTP:

```
1. Citoyen s'enregistre
2. Backend génère OTP (6 chiffres)
3. Essaie d'envoyer par WhatsApp (Meta API)
4. Si WhatsApp échoue → Fallback SMS (Twilio)
5. Si SMS échoue → Mode simulation (log)
```

### Stratégie Fallback:

```python
send_otp_whatsapp()
├─ Si Meta réussit → ✅ OTP via WhatsApp
├─ Si Meta échoue → Fallback send_otp_sms()
│  ├─ Si Twilio réussit → ✅ OTP via SMS
│  ├─ Si Twilio échoue → ✅ Mode simulation (log)
```

### Code Implémenté:

- ✅ `send_otp_whatsapp(phone, code)` - OTP par WhatsApp
- ✅ `send_alert_whatsapp(phone, message)` - Alertes par WhatsApp
- ✅ Fallback automatique sur SMS si WhatsApp échoue
- ✅ Logging détaillé pour debug

---

## Endpoints Affectés

```
POST /api/users/register/
  ↳ Envoie OTP par WhatsApp (avec fallback SMS)

POST /api/users/resend-otp/
  ↳ Renvoie OTP par WhatsApp (avec fallback SMS)

POST /api/users/password-reset/
  ↳ Code réinitialisation par WhatsApp (avec fallback SMS)
```

---

## Coûts Estimés

### Par mois (1000 utilisateurs):

**WhatsApp (Meta):**
- 1000 OTP enregistrement = €5
- 200 renvois OTP = €1
- 200 réinitialisation mot de passe = €1
- **Total: €7/mois**

**SMS (Twilio gratuit):**
- Limité à 5/jour = **BLOQUÉ après 5 utilisateurs**

**SMS (Twilio payant):**
- 1400 messages × €0.08 = **€112/mois**

---

## Checklist Avant Production

- [ ] Créer compte Meta / WhatsApp Business
- [ ] Obtenir `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Obtenir `WHATSAPP_ACCESS_TOKEN`
- [ ] Vérifier numéro de téléphone
- [ ] Mettre à jour `.env.production`
- [ ] Tester OTP localement
- [ ] Garder Twilio comme fallback
- [ ] Monitorer les taux de livraison

---

## Troubleshooting

### "No access to send a message"
→ Numéro pas vérifié. Aller dans WhatsApp Manager → "Phone Numbers" → vérifier le numéro

### "Invalid token"
→ Token expiré ou invalide. Regénérer dans Meta App Dashboard

### "Rate limited"
→ Trop de messages en peu de temps. Meta rate-limit: ~1000 messages/jour en essai

---

## Support

Documentation complète: https://developers.facebook.com/docs/whatsapp/cloud-api/
