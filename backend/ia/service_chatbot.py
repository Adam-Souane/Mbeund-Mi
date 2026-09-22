"""
Service chatbot NDAM - Assistant IA pour Mbeund-Mi
Répond aux questions sur les risques d'inondation basées sur le contexte local.
"""


class MbeundMiChatbot:
    """Assistant IA NDAM pour Thiaroye-sur-Mer"""

    def __init__(self):
        self.name = "NDAM"
        self.location = "Thiaroye-sur-Mer"

    def _handle_risk_question(self, niveau_risque, meteo_context):
        """Répond aux questions sur le risque d'inondation."""
        return (
            f"Le niveau de risque actuel à Thiaroye-sur-Mer est: {niveau_risque}\n\n"
            f"Contexte météorologique:\n{meteo_context}\n\n"
            f"Recommandations:\n"
            f"• Consultez régulièrement les alertes\n"
            f"• Localisez votre point de refuge sur la carte\n"
            f"• Préparez votre kit d'urgence\n"
            f"• Restez vigilant en cas de précipitations importantes"
        )

    def poser_question(self, question, meteo_context="", signalements_context="", niveau_risque="FAIBLE"):
        """
        Répond à une question en fonction du contexte local.

        Args:
            question: Question posée par l'utilisateur
            meteo_context: Contexte météorologique actuel
            signalements_context: Signalements validés récents
            niveau_risque: Niveau de risque actuel (FAIBLE, MODÉRÉ, ÉLEVÉ, CRITIQUE)

        Returns:
            Réponse textuelle du chatbot
        """
        question_lower = question.lower()

        # Réponses intelligentes basées sur le contexte et les mots-clés
        if any(word in question_lower for word in ["risque", "niveau", "danger"]):
            return self._handle_risk_question(niveau_risque, meteo_context)

        elif any(word in question_lower for word in ["signaler", "report", "how"]):
            return (
                "Pour signaler une inondation:\n"
                "1. Cliquez sur 'Signaler' dans le menu\n"
                "2. Choisissez la catégorie (Inondation, Égouts, Autre)\n"
                "3. Décrivez la situation (hauteur d'eau, localisation)\n"
                "4. Ajoutez une photo si possible\n"
                "5. Cliquez sur 'Envoyer'\n\n"
                "Votre signalement sera validé par une autorité avant publication."
            )

        elif any(word in question_lower for word in ["refuge", "safe", "security", "sécurité"]):
            return (
                "Les points de refuge disponibles à Thiaroye-sur-Mer:\n"
                "• Écoles (zones surélevées)\n"
                "• Mosquées et centres communautaires\n"
                "• Centres d'accueil d'urgence\n\n"
                "Consultez la carte pour localiser les refuges près de chez vous. "
                "En cas d'urgence, appelez le 18."
            )

        elif any(word in question_lower for word in ["avant", "before", "prepare", "préparer"]):
            return (
                "Préparation avant une inondation:\n"
                "✓ Préparez un kit d'urgence (eau, documents, médicaments)\n"
                "✓ Identifiez un point de refuge\n"
                "✓ Connaissez les numéros d'urgence\n"
                "✓ Suivez les alertes NDAM\n"
                "✓ Aidez vos voisins vulnérables\n\n"
                "Restez vigilant pendant les périodes de pluie."
            )

        elif any(word in question_lower for word in ["meteo", "weather", "pluie", "temperature"]):
            return f"Météo actuelle à Thiaroye-sur-Mer:\n{meteo_context}\n\nRestez vigilant en cas de fortes précipitations."

        elif any(word in question_lower for word in ["carte", "map", "zone", "zones"]):
            return (
                "La carte interactive montre:\n"
                "🔴 Zones rouges: Risque critique\n"
                "🟠 Zones orange: Risque élevé\n"
                "🟡 Zones jaunes: Risque modéré\n"
                "🟢 Zones vertes: Risque faible\n\n"
                "Consultez la carte pour connaître le risque chez vous."
            )

        else:
            # Réponse par défaut avec contexte
            return (
                f"Bonjour! Je suis NDAM, l'assistant de prévention des inondations.\n\n"
                f"Niveau de risque actuel: {niveau_risque}\n"
                f"Météo: {meteo_context}\n\n"
                f"Je peux vous aider avec:\n"
                f"• Comprendre le risque d'inondation\n"
                f"• Signaler une inondation\n"
                f"• Trouver un refuge\n"
                f"• Préparer avant une inondation\n\n"
                f"Posez votre question."
            )
