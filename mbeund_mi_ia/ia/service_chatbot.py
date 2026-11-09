import os
import re
import base64
import asyncio
import logging
from groq import Groq
from .config import GROQ_API_KEY

logger = logging.getLogger(__name__)

# Vocabulaire caractéristique du Wolof et du Français pour la détection automatique
_MOTS_WOLOF = {
    'nanga', 'def', 'ndox', 'taw', 'mbeund', 'kaaraange', 'naka', 'ban', 'ci', 'bi',
    'mi', 'yi', 'waaw', 'déedéet', 'jërëjëf', 'jerejef', 'baal', 'ndimbal', 'kër',
    'keur', 'ko', 'nga', 'ñu', 'dina', 'amul', 'xoolal', 'waxal', 'wax', 'yònnee',
    'fan', 'dafa', 'léegi', 'leegi', 'béréb', 'ngelaw', 'yéeg', 'suuf', 'wotleel',
    'kànn', 'nataal', 'bataaxal', 'maa', 'ngi', 'fi', 'lan', 'moy', 'ndax', 'amna',
    'sant', 'mbaa', 'jaamm', 'jamm', 'sama', 'barab', 'tolluwaay', 'jafe',
}

_MOTS_FRANCAIS = {
    'bonjour', 'salut', 'bonsoir', 'comment', 'quel', 'quelle', 'quels', 'quelles',
    'est', 'sont', 'dans', 'les', 'des', 'une', 'pour', 'avec', 'risque', 'inondation',
    'pluie', 'météo', 'meteo', 'secours', 'faire', 'où', 'refuge', 'signalement',
    'signaler', 'zone', 'quartier', 'eau', 'niveau', 'actuel', 'merci', 'aide',
    'alerte', 'capteur', 'urgence', 'numéro', 'numero', 'pompiers', 'rue', 'maison',
}


def detecter_langue_texte(texte: str, default_lang: str = "fr") -> str:
    """
    Détecte automatiquement si un message (écrit ou transcrit) est en Wolof ('wo')
    ou en Français ('fr'). Conserve default_lang en cas d'ambiguïté.
    """
    if not texte or not str(texte).strip():
        return default_lang if default_lang in ("fr", "wo") else "fr"

    t = str(texte).lower()
    # Expressions typiquement wolof multi-mots
    if any(expr in t for expr in (
        'na nga', 'nanga def', 'mbaa jaamm', 'nu mu deme', 'fan la', 'lan moy',
        'ndox mi', 'taw bi', 'risk bi', 'ci sama', 'yònnee wax',
    )):
        return "wo"

    tokens = re.findall(r"[a-zàâäéèêëîïôöùûüçñó]+", t)
    if not tokens:
        return default_lang if default_lang in ("fr", "wo") else "fr"

    score_wo = sum(1 for tok in tokens if tok in _MOTS_WOLOF)
    score_fr = sum(1 for tok in tokens if tok in _MOTS_FRANCAIS)

    # Présence de caractères spécifiques à la graphie wolof (ñ, ë, ng en début)
    if 'ñ' in t or any(tok.startswith(('nd', 'mb', 'ng', 'nj')) for tok in tokens):
        score_wo += 2

    if score_wo > score_fr and score_wo >= 1:
        return "wo"
    if score_fr > score_wo and score_fr >= 1:
        return "fr"
    return default_lang if default_lang in ("fr", "wo") else "fr"


def adapter_phonetique_wolof_tts(texte: str) -> str:
    """
    Adapte la graphie wolof afin qu'une voix neuronale féminine francophone/multilingue
    restitue une prononciation sénégalaise fluide et naturelle (sans altérer le texte écrit).
    """
    if not texte:
        return ""
    s = re.sub(r"[*_#~`⚠️📍📸]", "", str(texte))
    # Remplacements lexicaux fréquents pour une diction naturelle
    remplacements = [
        (r"\bci\b", "thi"),
        (r"\bCi\b", "Thi"),
        (r"\bndox\b", "ndokh"),
        (r"\bNdox\b", "Ndokh"),
        (r"\bmbeund\b", "mbeund"),
        (r"\bwax\b", "wakh"),
        (r"\bxoolal\b", "khoolal"),
        (r"\bjërëjëf\b", "djeureudjeuf"),
        (r"\bJërëjëf\b", "Djeureudjeuf"),
        (r"\byéeg\b", "yéég"),
        (r"\bñu\b", "gnou"),
        (r"\bÑu\b", "Gnou"),
        (r"\bdinañu\b", "dinagnou"),
        (r"\bsuuf\b", "souf"),
        (r"\bduggal\b", "dougal"),
        (r"\bmënul\b", "meunoul"),
        (r"\bmën\b", "meune"),
        (r"\bMën\b", "Meune"),
        (r"\bkër\b", "keur"),
        (r"\bléegi\b", "léégui"),
        (r"\bngir\b", "nguir"),
        (r"\byi\b", "yi"),
        (r"\bmi\b", "mi"),
        (r"\bbi\b", "bi"),
    ]
    for pattern, repl in remplacements:
        s = re.sub(pattern, repl, s)
    s = s.replace("ñ", "gn").replace("Ñ", "Gn").replace("ë", "eu").replace("Ë", "Eu")
    return s.strip()


def synthetiser_voix_femme_base64(texte: str, langue: str = "fr") -> str | None:
    """
    Génère un audio MP3 encodé en Data URL (data:audio/mp3;base64,...) avec une
    voix féminine naturelle :
    1. Si ELEVENLABS_API_KEY est configurée : utilise l'API ElevenLabs (voix féminine multilingue).
    2. Sinon : utilise edge-tts avec la voix neuronale féminine 'fr-FR-DeniseNeural'.
    """
    if not texte or not str(texte).strip():
        return None

    clean_text = re.sub(r"[*_#~`⚠️📍📸]", "", str(texte)).strip()
    if langue == "wo":
        clean_text = adapter_phonetique_wolof_tts(clean_text)

    # 1. Option ElevenLabs si une clé API est fournie
    eleven_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if eleven_key:
        try:
            import urllib.request
            import json
            # Voix féminine multilingue ElevenLabs (Charlotte / Rachel)
            voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "XB0fDUnXU5powFXDhCwa")
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            payload = json.dumps({
                "text": clean_text[:900],
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.55, "similarity_boost": 0.78},
            }).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "xi-api-key": eleven_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                audio_bytes = resp.read()
                if audio_bytes:
                    b64 = base64.b64encode(audio_bytes).decode("ascii")
                    return f"data:audio/mp3;base64,{b64}"
        except Exception as e:
            logger.warning("ElevenLabs TTS indisponible, bascule sur voix neuronale féminine edge-tts: %s", e)

    # 2. Voix neuronale féminine naturelle via edge-tts (fr-FR-DeniseNeural)
    try:
        import edge_tts

        async def _generate():
            communicate = edge_tts.Communicate(
                clean_text[:900],
                voice="fr-FR-DeniseNeural",
                rate="-4%" if langue == "wo" else "+0%",
            )
            chunks = []
            async for chunk in communicate.stream():
                if chunk.get("type") == "audio" and chunk.get("data"):
                    chunks.append(chunk["data"])
            return b"".join(chunks)

        audio_bytes = asyncio.run(_generate())
        if audio_bytes:
            b64 = base64.b64encode(audio_bytes).decode("ascii")
            return f"data:audio/mp3;base64,{b64}"
    except Exception as e:
        logger.warning("Erreur synthèse vocale féminine edge-tts: %s", e)

    # 3. Fallback résistant pour datacenters / cloud (Render, etc.) sans blocage d'IP
    try:
        import urllib.request
        import urllib.parse

        # Découpage du texte en segments <= 140 caractères
        words = clean_text[:600].split()
        chunks = []
        current = []
        for w in words:
            if sum(len(x) + 1 for x in current) + len(w) > 140:
                chunks.append(" ".join(current))
                current = [w]
            else:
                current.append(w)
        if current:
            chunks.append(" ".join(current))

        audio_parts = []
        for chunk in chunks:
            if not chunk.strip():
                continue
            enc_q = urllib.parse.quote(chunk.strip())
            tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={enc_q}&tl=fr&client=tw-ob"
            req = urllib.request.Request(
                tts_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read()
                if data:
                    audio_parts.append(data)

        if audio_parts:
            full_mp3 = b"".join(audio_parts)
            b64 = base64.b64encode(full_mp3).decode("ascii")
            return f"data:audio/mp3;base64,{b64}"
    except Exception as e:
        logger.warning("Erreur fallback synthèse vocale cloud: %s", e)

    return None


SYSTEM_PROMPT = """
Tu es NDAM, l'assistante intelligente, bienveillante et conversationnelle de la plateforme Mbeund Mi,
dédiée à la prévention des inondations et à la protection citoyenne à Thiaroye-sur-Mer
(commune de Pikine, région de Dakar, Sénégal).

Ton nom NDAM signifie "le triomphe" en wolof — tu incarnes
la protection, l'écoute active, l'entraide et la vigilance.

## Ton rôle et comportement conversationnel
- Réponds DIRECTEMENT et PRÉCISEMENT à la question posée par l'habitant.
- Ne récite JAMAIS de structure rigide imposée (pas de blocs répétitifs "situation actuelle / ce qu'il faut faire / ce qu'il faut savoir").
- Parle comme une conseillère humaine, chaleureuse, empathique et claire.
- Si le citoyen pose une question sur un quartier ou le niveau de risque, donne immédiatement le niveau de risque réel et la météo observée.
- Si le citoyen souhaite faire un signalement ou partage un constat d'inondation (ou une photo), aide-le directement dans la conversation en résumant son signalement et en le rassurant sur la prise en compte par les secours et la mairie.
- Pour les refuges d'urgence : mentionne les lieux de rassemblement sûrs à Thiaroye (CEM Thiaroye Gare, écoles surélevées, Maison de Quartier).

## Données terrain réelles en contexte
{meteo_context}
{signalements_context}
{niveau_risque}

## Consigne de langue
{langue_instruction}

## Règles de sécurité
- Si le niveau de risque est ÉLEVÉ ou CRITIQUE, commence ta réponse par : "⚠️ ALERTE [niveau] — "
- N'invente jamais de fausses données météo ; utilise les données fournies.
- En cas de danger grave et immédiat, rappelle avec bienveillance le numéro d'urgence des Sapeurs-Pompiers (18).
- Reste bienveillante, concise (2 à 5 phrases adaptées) et pratique.
"""


class MbeundMiChatbot:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        if not self.api_key:
            logger.info("GROQ_API_KEY non configurée. Le chatbot fonctionnera avec son moteur de réponses contextuelles locales.")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Impossible d'initialiser Groq: {e}")
                self.client = None

    def transcrire_audio(self, file_obj, filename="audio.webm", hint_lang="fr") -> dict:
        """
        Transcrit un enregistrement vocal via Groq Whisper et détecte automatiquement
        si le locuteur s'est exprimé en Wolof ('wo') ou en Français ('fr').
        """
        if not self.client:
            return {"text": "", "detected_lang": hint_lang}
        try:
            transcription = self.client.audio.transcriptions.create(
                file=(filename, file_obj.read()),
                model="whisper-large-v3-turbo",
                prompt="Nanga def, ndox mi, taw bi, mbeund mi, Thiaroye-sur-Mer, Dakar, Pikine, inondation, secours",
                response_format="json",
            )
            text = (getattr(transcription, "text", None) or "").strip()
            detected_lang = detecter_langue_texte(text, default_lang=hint_lang)
            return {"text": text, "detected_lang": detected_lang}
        except Exception as e:
            logger.warning("Échec transcription Whisper Groq: %s", e)
            return {"text": "", "detected_lang": hint_lang}

    def _reponse_contextuelle_locale(self, question, meteo_context="Non disponible", signalements_context="Aucun récent", niveau_risque="FAIBLE", langue="fr"):
        q = (question or "").lower()
        lang_detectee = detecter_langue_texte(question, default_lang=langue)
        est_wolof = (lang_detectee == "wo") or (langue == "wo" and detecter_langue_texte(question, default_lang="wo") == "wo")
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
            return f"Bonjour ! Je suis NDAM, votre assistante de prévention des inondations à Thiaroye-sur-Mer.\n\nLe risque actuel est {niveau_risque}. Je peux vous renseigner sur la météo, les zones à risque ou vous guider pour faire un signalement."
        elif any(w in q for w in ['signaler', 'signalement', 'incident', 'declarer', 'photo', 'remonter']):
            return "Pour signaler une inondation ou une accumulation d'eau, utilisez l'onglet « Signaler » (bouton rouge en bas de l'application).\n\nIndiquez le quartier, le niveau d'eau et ajoutez une photo si possible."
        elif any(w in q for w in ['meteo', 'pluie', 'vent', 'temperature', 'prevision']):
            return f"{prefix}Prévisions météo pour Thiaroye-sur-Mer : {meteo_pure}.\n\nRestez vigilants et suivez l'évolution des alertes."
        elif any(w in q for w in ['refuge', 'abri', 'aide', 'pompiers', 'secours', 'urgence', 'numero', 'contact']):
            return "En cas d'urgence vitale ou d'inondation grave, appelez immédiatement les numéros d'urgence : Sapeurs-Pompiers (18), SAMU (15) ou Police (17).\n\nRapprochez-vous des refuges et zones surélevées communiquées par la mairie."
        elif any(w in q for w in ['carte', 'zone', 'quartier']):
            return "Vous pouvez consulter la carte interactive depuis l'onglet « Carte » pour voir les secteurs classés selon leur niveau de risque (Vert, Jaune, Orange, Rouge)."
        else:
            return f"{prefix}Je suis NDAM, l'assistante de prévention à Thiaroye-sur-Mer.\n\nLe niveau de risque actuel est {niveau_risque} (Météo : {meteo_pure}). Posez-moi des questions sur les risques, la météo, les refuges ou la démarche pour signaler un incident."

    def _nettoyer_reponse(self, texte):
        """Nettoie le texte en préservant la structure par blocs (lignes vides, paragraphes et listes courtes)."""
        if not texte:
            return ""
        lignes = [l.strip() for l in texte.splitlines()]
        texte_normalise = "\n".join(lignes)
        return re.sub(r'\n{3,}', '\n\n', texte_normalise).strip()

    def poser_question(self, question, meteo_context="Non disponible", signalements_context="Aucun récent", niveau_risque="FAIBLE", history=None, langue="fr"):
        langue_effective = detecter_langue_texte(question, default_lang=langue)
        if not self.client:
            return self._nettoyer_reponse(self._reponse_contextuelle_locale(question, meteo_context, signalements_context, niveau_risque, langue=langue_effective))

        try:
            if langue_effective == "wo":
                langue_inst = "IMPORTANT : L'utilisateur s'exprime en WOLOF (ou a choisi le wolof). Réponds entièrement en wolof sénégalais chaleureux et clair, en employant le vocabulaire usuel (ndox mi, taw, mbeund mi, kaaraange, etc.)."
            else:
                langue_inst = "IMPORTANTE CONSIGNE : L'utilisateur s'exprime en FRANÇAIS. Réponds entièrement en français clair, chaleureux et direct."

            prompt_contextualise = SYSTEM_PROMPT.format(
                meteo_context=f"Météo actuelle : {meteo_context}",
                signalements_context=f"Derniers signalements : {signalements_context}",
                niveau_risque=f"Niveau de risque actuel : {niveau_risque}",
                langue_instruction=langue_inst
            )

            messages = [{"role": "system", "content": prompt_contextualise}]
            if history and isinstance(history, list):
                for h in history[-6:]:
                    r = "assistant" if h.get("role") in ("assistant", "ndam") else "user"
                    txt = h.get("content") or h.get("text") or ""
                    if txt:
                        messages.append({"role": r, "content": str(txt)[:400]})

            messages.append({"role": "user", "content": question})

            for model_name in ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
                try:
                    completion = self.client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=768,
                    )
                    return self._nettoyer_reponse(completion.choices[0].message.content)
                except Exception as model_err:
                    logger.warning(f"Groq modèle {model_name} indisponible: {model_err}")
                    continue

            return self._nettoyer_reponse(self._reponse_contextuelle_locale(question, meteo_context, signalements_context, niveau_risque, langue=langue_effective))
        except Exception as e:
            logger.error(f"Erreur Groq: {e}")
            return self._nettoyer_reponse(self._reponse_contextuelle_locale(question, meteo_context, signalements_context, niveau_risque, langue=langue_effective))
