import sys
import os

# Ajouter le répertoire racine au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ia.service_chatbot import MbeundMiChatbot
from ia.config import GROQ_API_KEY

def main():
    print("="*50)
    print("🤖 DÉMO CHATBOT MBEUND-MI (Groq)")
    print("="*50)
    
    if not GROQ_API_KEY:
        print("ERREUR: Veuillez configurer GROQ_API_KEY dans votre fichier .env")
        return
        
    chatbot = MbeundMiChatbot()
    print("Assistant NDAM initialisé avec succès.")
    print("Contexte injecté par défaut: Risque ÉLEVÉ, Pluie forte (30mm/h)")
    print("Tapez 'quit' pour quitter.\n")
    
    while True:
        question = input("\nVous: ")
        if question.lower() in ['quit', 'exit', 'q']:
            break
            
        print("NDAM réfléchit...")
        reponse = chatbot.poser_question(
            question=question,
            meteo_context="Pluie forte (30mm/h), vent 20km/h.",
            signalements_context="1 signalement à Wakhinane (rues inondées).",
            niveau_risque="ÉLEVÉ"
        )
        print(f"\nNDAM: {reponse}")

if __name__ == "__main__":
    main()
