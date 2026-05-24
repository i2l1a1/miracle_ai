import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, AIMessage
from typing import List
import asyncio
import logging

load_dotenv(dotenv_path=".env")

logger = logging.getLogger("miracle.generation")


def _build_chat(max_tokens=512, temperature=0.0) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model=os.getenv("OPENROUTER_MODEL", "arcee-ai/trinity-mini:free"),
        extra_body={"reasoning": {"enabled": True}},
        max_tokens=max_tokens,
        temperature=temperature
    )


async def safe_ainvoke(chat: ChatOpenAI, messages: List[BaseMessage], retries: int = 3, delay: float = 1.0):
    for attempt in range(retries):
        try:
            return await chat.ainvoke(messages)
        except Exception as e:
            error_str = str(e)
            logger.warning(
                f"OpenRouter request failed attempt={attempt + 1}/{retries} error={error_str}"
            )
            if "JSONDecodeError" in error_str or "Expecting value" in error_str:
                if attempt < retries - 1:
                    await asyncio.sleep(delay * (attempt + 1))
                    continue
            else:
                raise
    logger.error(f"OpenRouter request failed after {retries} attempts")
    return AIMessage(content="The answer cannot be generated.")
