import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

load_dotenv(dotenv_path=".env")


def _build_chat() -> ChatOpenAI:
    return ChatOpenAI(
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model=os.getenv("OPENROUTER_MODEL", "arcee-ai/trinity-mini:free"),
        extra_body={"reasoning": {"enabled": True}},
    )


def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat()
    user_content = f"Заголовок: {question_title}\n\nТекст вопроса:\n{question_text}"
    messages = [
        SystemMessage(
            content="Ты помощник на Q&A площадке. Отвечай по сути вопроса и ясно."
        ),
        HumanMessage(content=user_content),
    ]
    result = chat.invoke(messages)
    return result.content or ""
