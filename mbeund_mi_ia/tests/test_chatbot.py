import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
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
    assert call_args['model'] == "llama-3.3-70b-versatile"
    assert call_args['temperature'] == 0.3
    
    messages = call_args['messages']
    assert messages[1]['content'] == "Qui es-tu ?"
    assert "Tu es NDAM" in messages[0]['content']

def test_poser_question_sans_api_key():
    bot = MbeundMiChatbot()
    bot.client = None # Force No API key scenario
    reponse = bot.poser_question("Qui es-tu ?")
    assert "maintenance" in reponse
