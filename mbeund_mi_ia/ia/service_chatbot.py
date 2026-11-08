from groq import Groq
from .config import GROQ_API_KEY

SYSTEM_PROMPT = """
Tu es NDAM, l'assistant intelligent et bienveillant de la plateforme Mbeund Mi, 
dédiée à la prévention des inondations à Thiaroye-sur-Mer 
(commune de Pikine, région de Dakar, Sénégal).

Ton nom NDAM signifie "le triomphe" en wolof — tu incarnes 
la protection, l'entraide et la vigilance au service des habitants.

## Ton rôle
Tu es propulsé par Groq.
Tu assistes avec empathie deux types d'utilisateurs :
- Les habitants de Thiaroye-sur-Mer : comprendre les risques, 
  savoir quoi faire, trouver les refuges, signaler des zones inondées
- Les agents terrain et la mairie de Pikine : coordonner et informer

## Ce que tu sais faire
1. ALERTE      — informer sur le niveau de risque actuel et les prévisions de pluie
2. SIGNALEMENT — guider l'utilisateur pour signaler une inondation : 
                 indique TOUJOURS qu'il doit utiliser l'onglet « Signaler » 
                 (icône appareil photo / bouton rouge) dans l'application Mbeund-Mi
3. PRÉVENTION  — donner des conseils pratiques avant, pendant et après une inondation
4. CARTE       — aider à interpréter les zones à risque sur la carte interactive

## Données disponibles en contexte
{meteo_context}
{signalements_context}
{niveau_risque}

## Consigne de langue
{langue_instruction}

## Règles absolues
- Réponds clairement, avec bienveillance et brièvement (3-5 phrases).
- Si le niveau de risque est ÉLEVÉ ou CRITIQUE, commence ta réponse par : "⚠️ ALERTE [niveau] — "
- N'invente JAMAIS de données météo — utilise uniquement les données injectées ci-dessus.
- INTERDICTION FORMELLE D'INVENTER des numéros de téléphone.
  Pour signaler : orienter EXCLUSIVEMENT vers l'onglet « Signaler » de l'application. 
  Le numéro des Sapeurs-Pompiers (18) n'est autorisé QUE si le niveau de risque est ÉLEVÉ ou CRITIQUE, ou si l'utilisateur demande explicitement un numéro d'urgence. En dehors de ces deux cas, ne mentionne PAS le 18 ni les numéros d'urgence.
- Structure ta réponse en 2 ou 3 blocs courts séparés par une ligne vide (situation actuelle, ce qu'il faut faire, ce qu'il faut savoir).
- INTERDICTION STRICTE de répéter une phrase ou formule déjà formulée dans la même réponse.
- Reste strictement dans le domaine de la prévention des inondations et de la vie à Thiaroye-sur-Mer.
"""

class MbeundMiChatbot:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        if not self.api_key:
            import logging
            logging.getLogger(__name__).info("GROQ_API_KEY non configurée. Le chatbot fonctionnera avec son moteur de réponses contextuelles locales.")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Impossible d'initialiser Groq: {e}")
                self.client = None

    def _reponse_contextuelle_locale(self, question, meteo_context="Non disponible", signalements_context="Aucun récent", niveau_risque="FAIBLE", langue="fr"):
        q = (question or "").lower()
        est_wolof = (langue == "wo") or any(w in q for w in ['ndox', 'taw', 'nanga', 'yéeg', 'sant', 'na nga', 'naka', 'ban', 'thiaroye', 'xoolal'])
        is_high_risk = str(niveau_risque).upper() in ('ÉLEVÉ', 'CRITIQUE')
        user_asked_emergency = any(w in q for w in ['pompiers', 'urgence', 'numero', 'numéro', 'contact', '18', 'secours', 'ndimbal', 'wotleel'])

        meteo_pure = meteo_context
        has_gps = False
        if "|" in str(meteo_context):
            parties = str(meteo_context).split("|", 1)
            meteo_pure = parties[0].strip()
            has_gps = True

        if est_wolof:
            prefix = f"⚠️ ALERTE [{niveau_risque}] — " if is_high_risk else ""
            mention_18_wo = " Su amé jaxlé gu réy walla ndox mu yéeg, wotleel pompiers yi ci 18." if (is_high_risk or user_asked_emergency) else ""
            if any(w in q for w in ['risk', 'risque', 'danger', 'ndox', 'mbeund', 'inondation', 'situation', 'barab', 'position']):
                if has_gps:
                    return f"{prefix}Ci sa barab ci Thiaroye-sur-Mer, risk bi léegi dafa {niveau_risque}. Météo bi : {meteo_pure}. Capteur yi ci sa wet ñu ngi ci tolluwaay bu normal.{mention_18_wo}"
                return f"{prefix}Risk bi léegi ci Thiaroye-sur-Mer dafa {niveau_risque}. Météo bi : {meteo_pure}. Yëgle yi mujj : {signalements_context}.{mention_18_wo}"
            elif any(w in q for w in ['nanga', 'na nga', 'salam', 'bonjour', 'kham', 'ndam']):
                return f"Nanga def ! Man la NDAM, sa ndaw ci wallu kaaraange ak précaution mbeund mi ci Thiaroye-sur-Mer.\n\nRisk bi léegi dafa {niveau_risque}. Mën nga ma laaj météo, zone yi am risk walla ma wan la ni ngay signalele."
            elif any(w in q for w in ['signaler', 'signalement', 'wax', 'photo']):
                return "Ngir signalé ndox mi walla zone bu am problème, bësal bouton rouge bi ci suuf (« Signaler »).\n\nMën nga fa wax sa quartier, tolluwaay ndox mi ak duggal photo."
            elif any(w in q for w in ['taw', 'meteo', 'pluie', 'ngelaw']):
                return f"{prefix}Météo ci Thiaroye-sur-Mer : {meteo_pure}.\n\nNa ñu fexé ba teyee sunu bopp te déglou yëgle yi."
            elif any(w in q for w in ['pompiers', 'urgence', 'ndimbal', 'refuge']):
                return "Su amé kumpa walla ndox mi duggal kër yi, wotleel ci saa si Pompiers yi ci 18, SAMU ci 15 walla Police ci 17.\n\nDemal ci béréb yi gën a kawe ci quartier bi."
            else:
                return f"{prefix}Man la NDAM, sa ndaw ci Thiaroye-sur-Mer.\n\nRisk bi léegi dafa {niveau_risque} (Météo : {meteo_pure}). Mën nga ma laaj lépp luy kaaraange ndox ak taw."

        prefix = f"⚠️ ALERTE [{niveau_risque}] — " if is_high_risk else ""
        mention_18_fr = " En cas d'urgence immédiate, contactez les sapeurs-pompiers au 18." if (is_high_risk or user_asked_emergency) else ""
        if any(w in q for w in ['risque', 'danger', 'inondation', 'eau', 'alerte', 'situation', 'niveau', 'position']):
            if has_gps:
                return f"{prefix}À votre position actuelle à Thiaroye-sur-Mer, le niveau de risque est {niveau_risque}. Météo : {meteo_pure}. Les capteurs de proximité indiquent une situation sous contrôle.{mention_18_fr}"
            return f"{prefix}Le niveau de risque actuel à Thiaroye-sur-Mer est {niveau_risque}. Météo : {meteo_pure}. Derniers signalements : {signalements_context}.{mention_18_fr}"
        elif any(w in q for w in ['bonjour', 'salut', 'salam', 'hello', 'coucou']):
            return f"Bonjour ! Je suis NDAM, votre assistant de prévention des inondations à Thiaroye-sur-Mer.\n\nLe risque actuel est {niveau_risque}. Je peux vous renseigner sur la météo, les zones à risque ou vous guider pour faire un signalement."
        elif any(w in q for w in ['signaler', 'signalement', 'incident', 'declarer', 'photo', 'remonter']):
            return "Pour signaler une inondation ou une accumulation d'eau, utilisez l'onglet « Signaler » (bouton rouge en bas de l'application).\n\nIndiquez le quartier, le niveau d'eau et ajoutez une photo si possible."
        elif any(w in q for w in ['meteo', 'pluie', 'vent', 'temperature', 'prevision']):
            return f"{prefix}Prévisions météo pour Thiaroye-sur-Mer : {meteo_pure}.\n\nRestez vigilants et suivez l'évolution des alertes."
        elif any(w in q for w in ['refuge', 'abri', 'aide', 'pompiers', 'secours', 'urgence', 'numero', 'contact']):
            return "En cas d'urgence vitale ou d'inondation grave, appelez immédiatement les numéros d'urgence : Sapeurs-Pompiers (18), SAMU (15) ou Police (17).\n\nRapprochez-vous des refuges et zones surélevées communiquées par la mairie."
        elif any(w in q for w in ['carte', 'zone', 'quartier']):
            return "Vous pouvez consulter la carte interactive depuis l'onglet « Carte » pour voir les secteurs classés selon leur niveau de risque (Vert, Jaune, Orange, Rouge)."
        else:
            return f"{prefix}Je suis NDAM, l'assistant de prévention à Thiaroye-sur-Mer.\n\nLe niveau de risque actuel est {niveau_risque} (Météo : {meteo_pure}). Posez-moi des questions sur les risques, la météo, les refuges ou la démarche pour signaler un incident."

    def _nettoyer_reponse(self, texte):
        """Nettoie le texte en préservant la structure par blocs (lignes vides, paragraphes et listes courtes)."""
        if not texte:
            return ""
        import re
        lignes = [l.strip() for l in texte.splitlines()]
        texte_normalise = "\n".join(lignes)
        return re.sub(r'\n{3,}', '\n\n', texte_normalise).strip()

    def poser_question(self, question, meteo_context="Non disponible", signalements_context="Aucun récent", niveau_risque="FAIBLE", history=None, langue="fr"):
        if not self.client:
            return self._nettoyer_reponse(self._reponse_contextuelle_locale(question, meteo_context, signalements_context, niveau_risque, langue=langue))
            
        try:
            if langue == "wo":
                langue_inst = "IMPORTANT : L'utilisateur a choisi la langue WOLOF ou s'exprime en wolof. Réponds entièrement en wolof sénégalais chaleureux et clair, en employant le vocabulaire usuel (ndox mi, taw, mbeund mi, kaaraange, etc.)."
            else:
                langue_inst = "Réponds en français clair, chaleureux et direct. Si l'utilisateur pose une question en wolof, réponds-lui naturellement en wolof."

            prompt_contextualise = SYSTEM_PROMPT.format(
                meteo_context=f"Météo actuelle : {meteo_context}",
                signalements_context=f"Derniers signalements : {signalements_context}",
                niveau_risque=f"Niveau de risque actuel : {niveau_risque}",
                langue_instruction=langue_inst
            )

            # Construction des messages avec mémoire conversationnelle multi-tours
            messages = [{"role": "system", "content": prompt_contextualise}]
            if history and isinstance(history, list):
                for h in history[-6:]:
                    r = "assistant" if h.get("role") in ("assistant", "ndam") else "user"
                    txt = h.get("content") or h.get("text") or ""
                    if txt:
                        messages.append({"role": r, "content": str(txt)[:400]})

            messages.append({"role": "user", "content": question})
            
            # Modèles Groq actifs (gpt-oss-120b, gpt-oss-20b, qwen3.8-27b)
            for model_name in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]:
                try:
                    completion = self.client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=768,
                    )
                    return self._nettoyer_reponse(completion.choices[0].message.content)
                except Exception as model_err:
                    import logging
                    logging.getLogger(__name__).warning(f"Groq modèle {model_name} indisponible: {model_err}")
                    continue

            return self._nettoyer_reponse(self._reponse_contextuelle_locale(question, meteo_context, signalements_context, niveau_risque, langue=langue))
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Erreur Groq: {e}")
            return self._nettoyer_reponse(self._reponse_contextuelle_locale(question, meteo_context, signalements_context, niveau_risque, langue=langue))



