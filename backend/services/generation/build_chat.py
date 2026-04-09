import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv(dotenv_path=".env")


def _build_chat(max_tokens=512, temperature=0.0) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model=os.getenv("OPENROUTER_MODEL", "arcee-ai/trinity-mini:free"),
        extra_body={"reasoning": {"enabled": True}},
        max_tokens=max_tokens,
        temperature=temperature
    )