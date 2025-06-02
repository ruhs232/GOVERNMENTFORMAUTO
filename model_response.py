from langchain_ollama import ChatOllama

# Single model instance for fallback
_model = ChatOllama(
    model="llama3",
    base_url="http://localhost:11434",
    model_kwargs={"temperature": 0.0, "max_new_tokens": 512}
)

def get_model_response(prompt: str) -> str:
    """Invoke the standalone LLM with the given prompt (no RAG)."""
    return _model.invoke(prompt)