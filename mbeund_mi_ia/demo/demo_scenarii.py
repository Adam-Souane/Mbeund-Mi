import time
import os
import sys

base_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(base_dir)

try:
    from ia.service_prediction import PredictionService
    IA_AVAILABLE = True
except ImportError:
    IA_AVAILABLE = False

try:
    from apis.declencheur_alertes import envoyer_sms_urgence, Declencheur
    SMS_AVAILABLE = True
except ImportError:
    SMS_AVAILABLE = False

def executer_scenario(nom, niveau_eau_debut, pluie_mm, iter_count, step_eau):
    print(f"\n{'='*50}")
    print(f" DÉMARRAGE SCÉNARIO : {nom.upper()}")
    print(f"{'='*50}")
    print(f"{'='*50}")
    
    ia = PredictionService() if IA_AVAILABLE else None
    declencheur = Declencheur() if SMS_AVAILABLE else None
    
    eau = niveau_eau_debut
    mesures = []
    sms_envoye = False
    
    for i in range(iter_count):
        mesures.append({"pluie_mm": pluie_mm, "niveau_eau_cm": eau})
        print(f"[{i+1}/{iter_count}] Relevé simulé -> Eau: {eau:.1f}cm | Pluie: {pluie_mm}mm/h")
        
        if ia:
            pred = ia.analyser_risque(1, mesures)
            risque = pred["risque_global"].upper()
            conf = pred["confiance"]
            print(f"   > IA Analyse : Risque {risque} (Confiance {conf}%)")
            if risque in ["ORANGE", "ROUGE"] and declencheur:
                # Envoie la requête simultanément à l'IA, Django, Firebase et SMS
                print("   > 🔄 Synchronisation de l'alerte vers Django, Firebase et Twilio...")
                declencheur.verifier_et_declencher(zone_id=1, mesures_recentes=mesures)
                sms_envoye = True
        else:
            print("   > IA non disponible. Installez tensorflow pour voir la prédiction.")
            
        eau += step_eau
        time.sleep(2) # Simule l'attente pour l'effet "temps réel" de la démo

    print(f"\nFin du scénario {nom}.")

def main():
    print("\nMBEUND MI - OUTIL DE DÉMONSTRATION SOUTENANCE")
    print("1. Hivernage Normal (Risque Vert)")
    print("2. Épisode de Pluie Intense (Risque Orange)")
    print("3. Inondation Critique (Risque Rouge)")
    
    try:
        choix = input("\nChoisissez un scénario (1-3) : ")
        if choix == '1':
            executer_scenario("Hivernage Normal", 25.0, 5.0, 5, 0.0)
        elif choix == '2':
            executer_scenario("Pluie Intense", 35.0, 45.0, 5, 8.0)
        elif choix == '3':
            executer_scenario("Inondation Critique", 85.0, 80.0, 5, 12.0)
        else:
            print("Choix invalide.")
    except KeyboardInterrupt:
        print("\nDémo annulée.")

if __name__ == "__main__":
    main()
