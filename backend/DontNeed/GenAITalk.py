import google.generativeai as genai
import os
from dotenv import load_dotenv
import base64
model = None
def setup_genai():
 # Load API key from .env file
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=api_key)

    # Create the model instance
    model = genai.GenerativeModel("gemini-2.5-flash")

def AskGenAI(PromptText):
   
    # typical_prompt = "I want you  to reply in a way that is clear, concise, and informative." \
    # "it will be read via TTS so keep it short and to the point." \
    # "Avoid using formatting like bullet points or lists that may not be read well by TTS." \
    # "Use simple language and short sentences to ensure clarity when spoken aloud. Also in a response do not mention anything from here and prior in the response. Just use it as you format your response." \
    # "Respond to the user prompt below:"
    # Generate content
    # response = model.generate_content(typical_prompt + PromptText)
    if(model is None):
        print("WARNING: Model not setup, setting up now...")
        setup_genai()
    response = model.generate_content(PromptText)

    # print(response.text)
    return response.text


