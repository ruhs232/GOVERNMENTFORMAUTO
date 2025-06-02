import requests
import logging

BASE_URL = "http://localhost:11434"

def classify_name(name: str) -> str:
    """
    Calls Ollama’s generate endpoint for model "lang1",
    asking “is {name} a valid name” and returning exactly "Y" or "N".
    """
    payload = {
        "model": "lang12",                      # updated model name
        "prompt": f"is {name} a valid name",  # prompt remains
        "max_tokens": 1,                       # only need a single token: "Y" or "N"
        "temperature": 0.0,
        "stream": False
    }

    try:
        resp = requests.post(f"{BASE_URL}/api/generate", json=payload)
        resp.raise_for_status()
        data = resp.json()
        # Should be exactly "Y" or "N"
        return data.get("response", "").strip()
    except Exception as e:
        logging.error(f"[classifier] error calling Ollama: {e}")
        # return empty so frontend sees no "Y" and button stays disabled
        return ""
