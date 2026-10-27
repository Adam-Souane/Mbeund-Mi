import logging
import re
from groq import Groq
from .config import GROQ_API_KEY

logger = logging.getLogger(__name__)

# Modèles officiels Groq récents et rapides par ordre de préférence
GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

SYSTEM_PROMPT = """
Tu es NDAM, l'assistant intelligent de la plateforme Mbeund Mi, 
dédiée à la prévention des inondations à Thiaroye-sur-Mer 
(commune de Pikine, région de Dakar, Sénégal).

Ton nom NDAM signifie "le triomphe" en wolof — tu incarnes 
la protection et la vigilance au service des habitants.

## Ton rôle
Tu es propulsé par l'IA de Mbeund-Mi.
Tu assistes deux types d'utilisateurs :
- Les habitants de Thiaroye-sur-Mer : comprendre les risques, 
  savoir quoi faire, trouver les refuges et signaler des zones inondées.
- Les agents terrain et la mairie de Pikine : suivre la situation et sécuriser la population.

## Ce que tu sais faire
1. ALERTE      — informer sur le niveau de risque actuel et les prévisions météo pour Thiaroye-sur-Mer.
2. SIGNALEMENT — guider l'utilisateur pour signaler une inondation : 
                 indique TOUJOURS qu'il doit utiliser l'onglet « Signaler » 
                 (icône appareil photo) dans l'application Mbeund-Mi 
                 (indiquer le quartier, le niveau d'eau et une photo optionnelle).
3. PRÉVENTION  — donner des conseils pratiques avant, pendant et après une inondation.
4. CARTE & REFUGES — aider à localiser les lieux sûrs (CEM Thiaroye Gare, École Serigne Mansour Sy, etc.) 
                     et interpréter les zones à risque affichées sur la carte interactive.

## Données disponibles en contexte
{meteo_context}
{signalements_context}
{niveau_risque}

## Règles absolues
- Réponds TOUJOURS en français, clairement et avec bienveillance (3-5 phrases).
- Si l'utilisateur s'adresse à toi en Wolof, réponds de façon bilingue Wolof/Français chaleureuse.
- Si le niveau de risque est ÉLEVÉ ou CRITIQUE, commence ta réponse par : "⚠️ ALERTE [niveau] — ".
- N'invente JAMAIS de fausses données météo — utilise uniquement les données injectées ci-dessus.
- Pour signaler : orienter EXCLUSIVEMENT vers l'onglet « Signaler » de l'application Mbeund-Mi.
- En cas d'urgence vitale immédiate, rappelle les numéros officiels du Sénégal : Sapeurs-Pompiers (18), SAMU (15), Police (17).
- Reste strictement dans le domaine de la prévention des inondations à Thiaroye-sur-Mer.
"""


def _repondre_expert_local(question: str, meteo_context: str, signalements_context: str, niveau_risque: str) -> str:
    """
    Moteur de connaissances expert local pour Thiaroye-sur-Mer.
    Garantit une réponse instantanée, intelligente et ultra-précise
    même en cas d'absence de clé API Groq ou de coupure réseau.
    """
    q = (question or "").lower().strip()
    prefixe_alerte = f"⚠️ ALERTE {niveau_risque} — " if niveau_risque in ("ÉLEVÉ", "CRITIQUE") else ""

    # 1. Détection Wolof (Salutations & requêtes en langue locale)
    mots_wolof = ["salam", "nanga def", "naka nga def", "naka mu deme", "ndox", "taw", "mbeund", "fane lañuy", "ban waxtu"]
    if any(w in q for w in mots_wolof):
        if "ndox" in q or "taw" in q or "mbeund" in q or "deme" in q:
            return (
                f"{prefixe_alerte}Salam aleykoum ! Ci Thiaroye-sur-Mer, tolluwaay bi dafa nekk **{niveau_risque}** tay jii. "
                f"Météo bi : {meteo_context}. "
                f"Bu ndox mi di yéeg ci sa gokh, fexél ba jël foto ak adresse bi nga bind ko ci onglet « Signaler ». "
                f"Bu amé danger bu mag, wóoleel Sapeurs-Pompiers ci 18 !"
            )
        return (
            "Salam aleykoum ! Dalal ak jamm ci NDAM, sa assistant Mbeund-Mi ci Thiaroye-sur-Mer. "
            "Man nga ma laaj ci wàllu tolluwaay ndox mi, météo bi, naka lañuy signale mbaa fane lañuy dencu (refuges). "
            "Naka laa la mën a dimbalé tay ?"
        )

    # 2. Risque actuel & Vigilance
    if any(k in q for k in ["risque", "danger", "alerte", "situation", "niveau", "quel est le", "inond"]):
        rep = f"{prefixe_alerte}Le niveau de risque actuel à Thiaroye-sur-Mer est classé **{niveau_risque}**."
        if meteo_context and meteo_context != "Non disponible":
            rep += f" Les prévisions météo indiquent : {meteo_context}."
        if signalements_context and signalements_context != "Aucun récent":
            rep += f" Signalements citoyens récents : {signalements_context}."
        else:
            rep += " Aucun signalement critique récent n'a été remonté dans le secteur."
        rep += " Vous pouvez consulter la carte interactive pour suivre l'état précis de votre quartier."
        return rep

    # 3. Comment signaler un incident
    if any(k in q for k in ["signal", "déclarer", "photo", "mégaphone", "eau monte", "rue inondée", "incident"]):
        return (
            "Pour signaler une inondation ou une montée des eaux, utilisez directement l'onglet **« Signaler »** "
            "(icône appareil photo) dans le menu de votre application Mbeund-Mi. "
            "Indiquez votre quartier (ex: Thiaroye Gare, Fass, Santhiaba), le niveau approximatif de l'eau (chevilles, genoux, taille) "
            "et ajoutez une photo si possible. En cas de péril immédiat, contactez les Sapeurs-Pompiers au **18**."
        )

    # 4. Refuges, abris, carte et itinéraires
    if any(k in q for k in ["refuge", "abri", "évacu", "lieu sûr", "où aller", "où se réfugier", "carte", "itinéraire"]):
        return (
            f"{prefixe_alerte}À Thiaroye-sur-Mer, plusieurs lieux sûrs d'évacuation sont identifiés par les secours : "
            "**CEM Thiaroye Gare** (centre principal), **École Serigne Mansour Sy** (secteur Nord) et la **Maison des Jeunes de Thiaroye**. "
            "Rendez-vous sur l'onglet **« Carte interactive »** et cliquez sur le bouton *« Refuges »* : "
            "un itinéraire sécurisé pas-à-pas sera tracé depuis votre position vers le refuge le plus proche."
        )

    # 5. Prévention et conseils pratiques
    if any(k in q for k in ["conseil", "faire", "prépar", "prévention", "mesure", "sac", "caniveau", "consigne"]):
        return (
            f"{prefixe_alerte}Voici les réflexes essentiels face aux inondations à Thiaroye-sur-Mer : "
            "1️⃣ **Avant** : surélevez vos meubles et vos vivres, préparez une trousse d'urgence (médicaments, papiers, lampe torche) et dégagez les évacuations. "
            "2️⃣ **Pendant** : coupez l'électricité si l'eau s'infiltre, ne marchez jamais dans les eaux boueuses de ruissellement et rejoignez un point haut. "
            "3️⃣ **Secours** : Sapeurs-Pompiers au **18**, SAMU au **15** et Police au **17**."
        )

    # 6. Météo, pluie, marée et vent
    if any(k in q for k in ["météo", "pluie", "pleuv", "vent", "marée", "tempête", "orage", "prévision"]):
        rep = f"Les prévisions pour Thiaroye-sur-Mer indiquent : **{meteo_context}**."
        rep += (
            " La marée océanique influence directement le reflux des eaux pluviales sur le littoral de Thiaroye. "
            "Consultez le widget *« Marée & Vent marin »* sur votre page d'accueil pour anticiper les heures critiques de marée haute."
        )
        return rep

    # 7. Numéros d'urgence et contacts
    if any(k in q for k in ["numéro", "téléphone", "urgence", "contact", "pompier", "samu", "police", "secours"]):
        return (
            "En cas d'urgence immédiate à Thiaroye-sur-Mer et dans la région de Dakar, composez les numéros gratuits officiels : "
            "🚒 **Sapeurs-Pompiers** : 18 | 🚑 **SAMU** : 15 | 🚓 **Police Nationale** : 17. "
            "Pour les signalements non urgents de voirie ou de caniveaux bouchés, utilisez l'onglet « Signaler » de l'application."
        )

    # 8. Salutations et présentation générale
    if any(k in q for k in ["bonjour", "salut", "bonsoir", "coucou", "qui es-tu", "présent", "c'est quoi", "aide"]):
        return (
            "Bonjour ! Je suis **NDAM**, votre assistant intelligent pour la prévention des inondations à Thiaroye-sur-Mer. "
            f"Actuellement, le niveau de risque général est **{niveau_risque}** ({meteo_context}). "
            "Je peux vous renseigner sur la météo en direct, les refuges sûrs de la commune, "
            "les démarches pour signaler une inondation ou les bons réflexes de prévention. Que souhaitez-vous savoir ?"
        )

    # 9. Fallback contextualisé et bienveillant
    return (
        f"{prefixe_alerte}Je suis NDAM, dédié à la prévention des inondations à Thiaroye-sur-Mer. "
        f"Le risque actuel est **{niveau_risque}** ({meteo_context}). "
        "Vous pouvez m'interroger sur : 1️⃣ Le risque et la météo du jour, 2️⃣ Comment signaler une inondation, "
        "3️⃣ Les refuges sûrs les plus proches (CEM Thiaroye Gare, etc.), ou 4️⃣ Les conseils d'urgence. "
        "Comment puis-je vous aider ?"
    )


class MbeundMiChatbot:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info("MbeundMiChatbot: Client Groq initialisé avec succès.")
            except Exception as e:
                logger.warning("MbeundMiChatbot: Impossible d'initialiser le client Groq (%s). Fallback moteur local activé.", e)
                self.client = None
        else:
            logger.info("MbeundMiChatbot: Aucune clé GROQ_API_KEY détectée. Moteur expert local activé (100% autonome).")

    def poser_question(self, question, meteo_context="Non disponible", signalements_context="Aucun récent", niveau_risque="FAIBLE"):
        # 1. Si Groq est configuré, tenter l'appel LLM Cloud avec les modèles supportés
        if self.client:
            prompt_contextualise = SYSTEM_PROMPT.format(
                meteo_context=f"Météo actuelle : {meteo_context}",
                signalements_context=f"Derniers signalements : {signalements_context}",
                niveau_risque=f"Niveau de risque actuel : {niveau_risque}"
            )
            for model_name in GROQ_MODELS:
                try:
                    completion = self.client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": prompt_contextualise},
                            {"role": "user", "content": question}
                        ],
                        temperature=0.3,
                        max_tokens=512,
                    )
                    content = completion.choices[0].message.content
                    if content and content.strip():
                        return content.strip()
                except Exception as e:
                    logger.warning("Échec Groq avec le modèle %s: %s", model_name, e)
                    continue

        # 2. Moteur Expert Local (infaillible, déterministe et contextuel)
        return _repondre_expert_local(
            question=question,
            meteo_context=meteo_context,
            signalements_context=signalements_context,
            niveau_risque=niveau_risque,
        )
