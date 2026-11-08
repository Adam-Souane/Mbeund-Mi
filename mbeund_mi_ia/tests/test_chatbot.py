import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import patch, MagicMock
from ia.service_chatbot import MbeundMiChatbot

@patch('ia.service_chatbot.Groq')
def test_poser_question_groq(MockGroq):
    # Setup mock
    mock_client = MagicMock()
    mock_completion = MagicMock()
    mock_message = MagicMock()
    mock_message.content = "Bonjour, je suis NDAM."
    mock_completion.choices = [MagicMock(message=mock_message)]
    mock_client.chat.completions.create.return_value = mock_completion
    MockGroq.return_value = mock_client
    
    # Run
    bot = MbeundMiChatbot()
    # Force api_key for the test so it initializes the client properly in tests if missing
    bot.api_key = "fake_key"
    bot.client = mock_client
    
    reponse = bot.poser_question("Qui es-tu ?")
    
    # Assert
    assert reponse == "Bonjour, je suis NDAM."
    mock_client.chat.completions.create.assert_called_once()
    
    call_args = mock_client.chat.completions.create.call_args[1]
    assert call_args['model'] == "openai/gpt-oss-120b"
    assert call_args['temperature'] == 0.3
    
    messages = call_args['messages']
    assert messages[1]['content'] == "Qui es-tu ?"
    assert "Tu es NDAM" in messages[0]['content']

def test_poser_question_sans_api_key():
    bot = MbeundMiChatbot()
    bot.client = None # Force No API key scenario
    reponse = bot.poser_question("Qui es-tu ?")
    assert "NDAM" in reponse
    assert "Thiaroye-sur-Mer" in reponse


def test_reponse_locale_pas_de_18_en_risque_faible():
    bot = MbeundMiChatbot()
    bot.client = None
    reponse = bot.poser_question("Quel est le niveau de risque ?", niveau_risque="FAIBLE")
    assert "18" not in reponse
    assert "pompiers" not in reponse.lower()


def test_reponse_locale_mentionne_18_en_risque_critique():
    bot = MbeundMiChatbot()
    bot.client = None
    reponse = bot.poser_question("Quel est le niveau de risque ?", niveau_risque="CRITIQUE")
    assert "18" in reponse
    assert "pompiers" in reponse.lower()


def test_reponse_locale_mentionne_18_si_question_urgence():
    bot = MbeundMiChatbot()
    bot.client = None
    reponse = bot.poser_question("Quel est le numéro d'urgence des secours ?", niveau_risque="FAIBLE")
    assert "18" in reponse
    assert "pompiers" in reponse.lower()


def test_reponse_locale_wolof_pas_de_18_en_risque_faible():
    bot = MbeundMiChatbot()
    bot.client = None
    reponse = bot.poser_question("Ban quartier moo gën a am risk léegi ?", niveau_risque="FAIBLE", langue="wo")
    assert "18" not in reponse
    assert "pompiers" not in reponse.lower()


def test_nettoyer_reponse_preserve_paragraphes_et_listes():
    bot = MbeundMiChatbot()
    texte = "Situation normale à Thiaroye-sur-Mer.\n\n- Ne pas jeter d'ordures dans les canaux\n- Vérifier les évacuations d'eau\n\nRestez vigilants."
    nettoye = bot._nettoyer_reponse(texte)
    assert "- Ne pas jeter d'ordures" in nettoye
    assert "\n\n" in nettoye

