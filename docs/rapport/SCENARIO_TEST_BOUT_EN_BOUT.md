# Scénario de Test Manuel de Bout en Bout — MBEUND MI

**Date d'exécution :** 8 octobre 2026  
**Environnement :** Base de démonstration local / staging  
**Responsable :** Ngoné GUEYE (Frontend)  
**Résultat global :** SUCCESS (5/5 étapes validées)

---

## Liste de Vérification (Checklist d'Exécution)

### [x] Étape 1 : Inscription Citoyen
- **URL :** `/signup`
- **Actions :**
  1. Ouvrir le formulaire d'inscription citoyen.
  2. Saisir le prénom (`Moussa`), nom (`Diop`), téléphone (`+221771234567`), quartier (`Thiaroye Gare`) et mot de passe.
  3. Valider en cliquant sur **S'inscrire**.
- **Résultat constaté :** Compte créé avec succès, redirection automatique vers la page de saisie OTP `/verify-otp`.

### [x] Étape 2 : Vérification du Code OTP
- **URL :** `/verify-otp`
- **Actions :**
  1. Saisir le code de vérification OTP à 6 chiffres (`123456` en mode dev/démo ou reçu par SMS/e-mail).
  2. Cliquer sur **Vérifier le code**.
- **Résultat constaté :** Validation du jeton JWT, enregistrement dans le stockage local et redirection vers l'espace citoyen (`/citoyen`).

### [x] Étape 3 : Soumission d'un Signalement Citoyen avec Photo
- **URL :** `/citoyen/signaler`
- **Actions :**
  1. Sélectionner la catégorie **Inondation**.
  2. Indiquer la sévérité **Élevé** (eau à mi-jambe).
  3. Entrer la description : `"Inondation sévère marché Thiaroye Gare, passage bloqué."`.
  4. Joindre une photo du sinistre.
  5. Soumettre le formulaire.
- **Résultat constaté :** Toast de confirmation `"Signalement transmis avec succès"`. Le signalement apparaît en attente de modération.

### [x] Étape 4 : Modération et Émission d'Alerte par l'Autorité
- **URL :** `/autorite/signalements` & `/autorite/crise`
- **Actions :**
  1. Connexion avec l'identifiant Autorité (`agent.thiaroye`).
  2. Accéder à la page **Signalements terrain**.
  3. Cliquer sur **Valider** sur le signalement du marché Thiaroye Gare.
  4. Accéder à la page **Gestion de crise**.
  5. Rédiger et diffuser une alerte de vigilance **ROUGE** pour la zone Thiaroye Gare.
- **Résultat constaté :** Signalement validé et alerte ROUGE enregistrée et diffusée sur le canal de publication WebSocket.

### [x] Étape 5 : Réception de l'Alerte en Temps Réel sur l'Interface Citoyenne
- **URL :** `/citoyen/alertes` et `/citoyen`
- **Actions :**
  1. Retourner sur le profil Citoyen.
  2. Consulter la bannière de vigilance et le fil d'alertes récentes.
- **Résultat constaté :** Alerte ROUGE reçue instantanément, affichée en haut de l'écran avec consignes de sécurité et numéros d'urgence.

---

## Récapitulatif des 21 Écrans Répertoire Frontend

1. **Écran 1 :** Connexion Citoyen & Autorité (`/login`)
2. **Écran 2 :** Inscription Citoyen (`/signup`)
3. **Écran 3 :** Saisie du Code OTP (`/verify-otp`)
4. **Écran 4 :** Réinitialisation du mot de passe (`/forgot-password`)
5. **Écran 5 :** Inscription Autorité via Code Invitation (`/admin-register`)
6. **Écran 6 :** Accueil Citoyen (`/citoyen`)
7. **Écran 7 :** Carte Citoyenne Interactive (`/citoyen/carte`)
8. **Écran 8 :** Alertes & Prévisions Météo (`/citoyen/alertes`)
9. **Écran 9 :** Formulaire de Signalement avec Photo (`/citoyen/signaler`)
10. **Écran 10 :** Profil Citoyen & Préférences Notifications (`/citoyen/profil`)
11. **Écran 11 :** Assistant Virtuel Chatbot NDAM (`/citoyen/chat`)
12. **Écran 12 :** Tableau de Bord Autorité Supervision (`/autorite`)
13. **Écran 13 :** Carte Interactive Avancée Autorité (`/autorite/carte`)
14. **Écran 14 :** Prévisions Météo & Risques (`/autorite/previsions`)
15. **Écran 15 :** Tableau de Modération des Signalements Terrain (`/autorite/signalements`)
16. **Écran 16 :** Statistiques & Analytique Inondations (`/autorite/statistiques`)
17. **Écran 17 :** Salle de Commandement & Gestion de Crise (`/autorite/crise`)
18. **Écran 18 :** Administration & État des Capteurs IoT (`/autorite/capteurs`)
19. **Écran 19 :** Registre Communautaire & Refuges (`/autorite/registre`)
20. **Écran 20 :** Fiabilité & Performance du Modèle IA (`/autorite/fiabilite`)
21. **Écran 21 :** Exports de Rapports CSV / PDF (`/autorite/exports`)
